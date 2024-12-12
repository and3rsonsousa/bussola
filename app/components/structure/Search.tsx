/* eslint-disable jsx-a11y/no-autofocus */
import { useMatches, useNavigate, useOutletContext } from "@remix-run/react";
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

type CommandItemType = {
  name: string;
  items: {
    id: string | number;
    title: string;
    href?: string;
    click?: () => void;
    options: string[];
    obs?: {
      state: State;
      category: Category;
      priority: Priority;
      partner: Partner;
      responsibles: Person[];
    };
  }[];
};

export default function Search({
  search,
}: {
  search: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
}) {
  const navigate = useNavigate();
  const matches = useMatches();

  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [query] = useDebounce(value, 300);
  const { partners, states, categories, people, priorities, person } =
    matches[1].data as DashboardRootType;
  const { partner } = matches[3]
    ? (matches[3].data as DashboardPartnerType)
    : {};
  const { setCategoryFilter, categoryFilter, setStateFilter } =
    useOutletContext() as ContextType;

  let startSections: CommandItemType[] = [
    {
      name: "Parceiros",
      items: partners.map((partner) => ({
        id: partner.id,
        title: partner.title,
        options: [partner.title, partner.short, partner.slug],
        href: `/dashboard/${partner.slug}`,
      })),
    },
  ];

  startSections =
    partner !== undefined
      ? [
          ...startSections,
          {
            name: "Filtrar pelo Status",
            items: [
              {
                id: "clean-status",
                title: "Remover filtro de Status",
                click: () => {
                  setStateFilter(undefined);
                },
                options: ["status remover", "status limpar", "status clean"],
              },
              ...states.map((state) => ({
                id: state.id,
                title: state.title,
                click: () => {
                  setStateFilter(state);
                },
                options: [
                  "status ".concat(state.title),
                  "status ".concat(state.slug),
                ],
              })),
            ],
          },
          {
            name: "Filtrar pela Categoria",
            items: [
              {
                id: "clean-category",
                title: "Remover filtro de Categoria",
                click: () => {
                  setCategoryFilter([]);
                },
                options: [
                  "categoria remover",
                  "categoria limpar",
                  "categoria clean",
                ],
              },
              ...categories.map((category) => ({
                id: category.id,
                title: category.title,

                click: () => {
                  setCategoryFilter([category, ...categoryFilter]);
                },
                options: [
                  "categoria ".concat(category.title),
                  "categoria ".concat(category.slug),
                ],
              })),
            ],
          },
        ]
      : startSections;

  const [sections, setSections] = useState<CommandItemType[]>([
    {
      name: "Ações",
      items: [],
    },
    ...startSections,
  ]);

  const { env } = matches[0].data as {
    env: { SUPABASE_URL: string; SUPABASE_KEY: string };
  };

  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        search.setOpen((open) => !open);
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
          .containedBy("partners", partners.map((p) => p.slug)!)
          .textSearch("title", query)
          .then((value) => {
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
                    partner: partners.find((partner) => {
                      return partner.slug === action.partners[0];
                    })!,
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

            setSections([
              {
                name: "Ações",
                items: actions,
              },
              ...startSections,
            ]);

            setLoading(false);
          });
      }
    }

    if (query !== "" && query.length >= 3) {
      getActions();
    } else {
      setSections([
        {
          name: "Ações",
          items: [],
        },
        ...startSections,
      ]);
    }
  }, [query]);

  return (
    <CommandDialog open={search.open} onOpenChange={search.setOpen}>
      <CommandInput
        className={`text-xl font-medium`}
        value={value}
        onValueChange={setValue}
      />

      <CommandList className="scrollbars scrollbars-thin pb-2">
        <CommandEmpty>Nenhum resultado encontrado. 😬</CommandEmpty>
        {loading && (
          <CommandLoading className="flex justify-center p-4">
            <Loader size="md" />
          </CommandLoading>
        )}
        {sections.map((section, i) =>
          section.items.length > 0 ? (
            <CommandGroup key={section.name} heading={section.name}>
              {section.items.map((item, i) => (
                <CommandItem
                  key={i}
                  value={item.options.join(" ")}
                  onSelect={() => {
                    if (item.href) navigate(item.href);
                    else if (item.click) item.click();
                    search.setOpen(false);
                  }}
                  className="flex justify-between gap-8 overflow-hidden"
                >
                  <div className="line-clamp-1 font-bold tracking-tight">
                    {item.title}
                  </div>
                  {item.obs ? (
                    <div className="flex items-center gap-2">
                      {item.obs.priority.slug === PRIORITIES.high ? (
                        <Icons id="high" className="text-rose-500" />
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
