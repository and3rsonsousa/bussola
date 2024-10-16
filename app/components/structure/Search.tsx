/* eslint-disable jsx-a11y/no-autofocus */
import { useMatches, useNavigate } from "@remix-run/react";
import { useDebounce } from "use-debounce";
import { createBrowserClient } from "@supabase/ssr";
import { CommandLoading } from "cmdk";
import React, { useEffect, useState } from "react";
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
import Loader from "./Loader";

export default function Search({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const matches = useMatches();

  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [query] = useDebounce(value, 300);
  const { partners, states, categories, people, priorities, person } =
    matches[1].data as DashboardRootType;

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
        setLoading(true);

        supabase
          .from("actions")
          .select("*")
          .is("archived", false)
          .contains("responsibles", person?.admin ? [] : [person.user_id])
          .textSearch("title", query)
          .then((value) => {
            const s = sections;
            const actions = value.data
              ? value.data.map((action: Action) => ({
                  id: action.id,
                  title: action.title,
                  href: `/dashboard/action/${action.id}`,
                  options: [action.title, action.id],
                  obs: {
                    state: states.find((state) => state.slug === action.state)!,
                    category: categories.find(
                      (category) => category.slug === action.category,
                    )!,
                    partner: partners.find(
                      (partner) => partner.slug === action.partner,
                    )!,
                    priority: priorities.find(
                      (priority) => priority.slug === action.priority,
                    )!,
                    responsibles: people.filter(
                      (person) =>
                        action.responsibles.findIndex(
                          (responsible_id) => responsible_id === person.user_id,
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

    if (query !== "" && query.length >= 3) {
      getActions();
    } else {
      setSections([
        sections[0],
        {
          name: "Ações",
          items: [],
        },
      ]);
    }
  }, [query]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        className={`text-xl font-medium`}
        value={value}
        onValueChange={setValue}
      />

      <CommandList className="scrollbars scrollbars-thin">
        <CommandEmpty>Nenhum resultado encontrado. 😬</CommandEmpty>
        {loading && (
          <CommandLoading className="flex justify-center p-4">
            <Loader size="md" />
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
                  <div className="line-clamp-1 font-bold tracking-tight">
                    {item.title}
                  </div>
                  {item.obs ? (
                    <div className="flex items-center gap-2">
                      {item.obs.priority.slug === PRIORITIES.high ? (
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
                          bg: item.obs.partner.colors[0],
                          fg: item.obs.partner.colors[1],
                        }}
                      />
                      <Icons
                        id={item.obs.category.slug}
                        className="opacity-50"
                      />
                      <div
                        className={`size-2 rounded-full`}
                        style={{ backgroundColor: item.obs.state.color }}
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
