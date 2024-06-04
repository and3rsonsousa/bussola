/* eslint-disable jsx-a11y/no-autofocus */
import { useMatches, useNavigate } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import { CommandLoading } from "cmdk";
import { useEffect, useState } from "react";
import { PRIORITIES } from "~/lib/constants";
import { Avatar, Icons } from "~/lib/helpers";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";

export default function Search() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const matches = useMatches();
  const { partners, states, categories, people, priorities } = matches[1]
    .data as DashboardDataType;

  const [sections, setSections] = useState<
    Array<{
      name: string;
      items: {
        id: string | number;
        title: string;
        href: string;
        options: string[];
        obs?: {
          state: State;
          category: Category;
          priority: Priority;
          partner: Partner;
          responsibles: Person[];
        };
      }[];
    }>
  >([
    {
      name: "Parceiros",
      items: partners.map((partner) => ({
        id: partner.id,
        title: partner.title,
        options: [partner.title, partner.short, partner.slug],
        href: `/dashboard/${partner.slug}`,
      })),
    },
    {
      name: "Ações",
      items: [],
    },
  ]);

  const { env } = matches[0].data as {
    env: { SUPABASE_URL: string; SUPABASE_KEY: string };
  };

  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", keyDown);
    return () => document.removeEventListener("keydown", keyDown);
  }, []);

  useEffect(() => {
    async function getActions() {
      if (supabase && sections) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setLoading(true);
          const { data: person } = await supabase
            .from("people")
            .select("*")
            .eq("user_id", user.id)
            .single();
          supabase
            .from("actions")
            .select("*")
            .contains("responsibles", person?.admin ? [] : [user.id])
            .then((value) => {
              const s = sections;
              const actions = value.data
                ? value.data.map((action: Action) => ({
                    id: action.id,
                    title: action.title,
                    href: `/dashboard/action/${action.id}`,
                    options: [action.title, action.id],
                    obs: {
                      state: states.find(
                        (state) => state.id === action.state_id,
                      )!,
                      category: categories.find(
                        (category) => category.id === action.category_id,
                      )!,
                      partner: partners.find(
                        (partner) => partner.id === action.partner_id,
                      )!,
                      priority: priorities.find(
                        (priority) => priority.id === action.priority_id,
                      )!,
                      responsibles: people.filter(
                        (person) =>
                          action.responsibles.findIndex(
                            (responsible_id) =>
                              responsible_id === person.user_id,
                          ) >= 0,
                      ),
                    },
                  }))
                : [];

              s[1].items = actions;
              setSections(() => s);
              setLoading(false);
            });
        }
      }
    }

    getActions();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        className={`text-xl font-medium`}
        value={value}
        onValueChange={setValue}
      />

      <CommandList className="scrollbars scrollbars-thin">
        <CommandEmpty>No results Founds</CommandEmpty>
        {loading && (
          <CommandLoading>
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-b-transparent"></div>
          </CommandLoading>
        )}
        {sections.map((section, i) =>
          section.items.length > 0 && (i === 1 ? value.length > 1 : true) ? (
            <CommandGroup key={section.name} heading={section.name}>
              {section.items.map((item, i) => (
                <CommandItem
                  key={i}
                  value={[item.title, ...item.options].join(" ")}
                  onSelect={() => {
                    navigate(item.href);
                    setOpen(false);
                  }}
                  className="flex justify-between gap-8 overflow-hidden"
                >
                  <div className="line-clamp-1   tracking-tight">
                    {item.title}
                  </div>
                  {item.obs ? (
                    <div className="flex items-center gap-2">
                      {item.obs.priority.id === PRIORITIES.high ? (
                        <Icons id="high" className="text-error-500" />
                      ) : null}
                      <div className="flex">
                        {item.obs.responsibles.map((responsible) => (
                          <Avatar
                            item={{
                              image: responsible.image,
                              short: responsible.initials!,
                            }}
                            key={responsible.id}
                            group
                          />
                        ))}
                      </div>
                      <Avatar
                        item={{
                          short: item.obs.partner.short,
                          bg: item.obs.partner.bg,
                          fg: item.obs.partner.fg,
                        }}
                      />
                      <Icons
                        id={item.obs.category.slug}
                        className="opacity-50"
                      />
                      <div
                        className={`size-4 rounded-full border-4 border-${item.obs.state.slug}`}
                      ></div>
                    </div>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null,
        )}
      </CommandList>
    </CommandDialog>
  );
}
