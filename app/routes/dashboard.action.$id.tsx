import {
  Link,
  useFetchers,
  useLoaderData,
  useMatches,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@vercel/remix";
import { format, formatDistanceToNow, parseISO } from "date-fns";

import { ptBR } from "date-fns/locale";
import { CalendarIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import Loader from "~/components/structure/Loader";
import Tiptap from "~/components/structure/Tiptap";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { INTENTS } from "~/lib/constants";
import { Avatar, Icons } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { headers, supabase } = createClient(request);
  const { id } = params;

  if (!id) throw new Error("$id não foi definido");

  const { data: action } = await supabase
    .from("get_full_actions")
    .select("*")
    .eq("id", id)
    .returns<Action[]>()
    .single();

  invariant(action);

  return json({ headers, action });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `${data?.action?.title} / ʙússoʟa`,
    },
  ];
};

export default function ActionPage() {
  const { action: baseAction } = useLoaderData<typeof loader>();
  const [action, setAction] = useState(baseAction);
  const [actions, setActions] = useState<Action[] | null>();

  const submit = useSubmit();
  const matches = useMatches();

  const { categories, partners, people, priorities, states } = matches[1]
    .data as DashboardDataType;

  const partner = partners.find(
    (partner) => partner.id === action.partner_id,
  ) as Partner;
  const category = categories.find(
    (category) => category.id === action.category_id,
  ) as Category;
  const state = states.find((state) => state.id === action.state_id) as State;
  const priority = priorities.find(
    (priority) => priority.id === action.priority_id,
  ) as Priority;
  const responsibles: Person[] = [];
  action.responsibles?.filter((user_id) =>
    responsibles.push(
      people.find((person) => person.user_id === user_id) as Person,
    ),
  );
  const date = parseISO(action.date);

  const handleActions = (data: {
    [key: string]: string | number | string[] | null;
  }) => {
    submit(
      { ...data },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  };

  const navigation = useNavigation();
  const navigate = useNavigate();
  const fetchers = useFetchers();

  const isWorking =
    navigation.state !== "idle" ||
    fetchers.filter((f) => f.formData).length > 0;

  const { env } = matches[0].data as {
    env: { SUPABASE_URL: string; SUPABASE_KEY: string };
  };

  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  useEffect(() => {
    async function getOtherActions() {
      const { data: actions } = await supabase
        .from("get_full_actions")
        .select()
        .match({ partner_id: baseAction.partner_id })
        .returns<Action[]>();
      setActions(actions);
    }

    getOtherActions();
  }, []);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden lg:w-1/2">
      <div className="flex shrink grow-0 items-center justify-between p-4 text-sm">
        <div className="flex items-center gap-2">
          <Avatar
            item={{
              short: partner.short,
              bg: partner.bg,
              fg: partner.fg,
            }}
            size="md"
            style={{
              viewTransitionName: "avatar-partner",
            }}
          />
          <div>
            <Link
              to={`/dashboard/${partner.slug}`}
              className="font-extrabold uppercase tracking-wider transition"
            >
              {partner.title}
            </Link>
            <div className="text-[11px] leading-none tracking-wide">
              {format(
                parseISO(baseAction?.updated_at as string),
                "yyyy-MM-dd HH:mm:ss",
              ) ===
              format(
                parseISO(baseAction?.created_at as string),
                "yyyy-MM-dd HH:mm:ss",
              )
                ? "Criado "
                : "Atualizado "}
              {formatDistanceToNow(parseISO(baseAction?.updated_at as string), {
                locale: ptBR,
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink grow flex-col gap-4 overflow-hidden px-4">
        {/* Título */}
        <div
          contentEditable="true"
          dangerouslySetInnerHTML={{
            __html: action?.title as string,
          }}
          onBlur={(e) =>
            setAction({
              ...action,
              title: e.currentTarget.innerText,
            })
          }
          className="bg-transparent text-5xl font-extrabold tracking-tighter outline-none transition"
          onPaste={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setAction({
              ...action,
              title: e.clipboardData.getData("text"),
            });
          }}
        />
        {/* Descrição */}
        <div className="flex shrink grow flex-col overflow-hidden">
          <div className="mb-2 flex items-center gap-4 text-xs font-medium uppercase tracking-wider">
            <div>Descrição</div>
          </div>

          <div className="scrollbars">
            <Tiptap
              content={action.description}
              onBlur={(text) => {
                setAction({ ...action, description: text });
              }}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          {/* Partners */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full border-none outline-none ring-ring ring-offset-2 ring-offset-background focus:ring-2">
              <Avatar
                item={{
                  short: partner.short,
                  bg: partner.bg,
                  fg: partner.fg,
                }}
                size="lg"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-content">
              {partners.map((partner) => (
                <DropdownMenuItem
                  key={partner.id}
                  className="bg-item flex items-center gap-2"
                  textValue={partner.title}
                  onSelect={async () => {
                    if (partner.id !== action.partner_id) {
                      setAction({
                        ...action,
                        partner_id: partner.id,
                      });
                    }
                  }}
                >
                  <Avatar
                    item={{
                      short: partner.short,
                      bg: partner.bg,
                      fg: partner.fg,
                    }}
                  />
                  <span>{partner.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Categoria */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full border-none p-2 outline-none ring-ring ring-offset-2 ring-offset-background focus:ring-2">
              <Icons id={category.slug} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-content">
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  className="bg-item flex items-center gap-2"
                  textValue={category.title}
                  onSelect={async () => {
                    if (category.id !== action.category_id) {
                      setAction({
                        ...action,
                        category_id: category.id,
                      });
                    }
                  }}
                >
                  <Icons id={category.slug} className={`size-4 opacity-50`} />
                  <span>{category.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* States */}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={`flex items-center rounded border-none px-3 py-1 font-semibold outline-none ring-ring ring-offset-background focus:ring-2 focus:ring-offset-2 bg-${state.slug} text-white`}
            >
              {state.title}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-content">
              {states.map((state) => (
                <DropdownMenuItem
                  key={state.id}
                  className="bg-item flex items-center gap-2"
                  textValue={state.title}
                  onSelect={async () => {
                    if (state.id !== action.state_id) {
                      setAction({
                        ...action,
                        state_id: state.id,
                      });
                    }
                  }}
                >
                  <div
                    className={`my-1 h-3 w-3 rounded-full border-2 border-${state.slug}`}
                  ></div>
                  <span>{state.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Prioridade */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full border-none p-2 outline-none ring-ring ring-offset-2 ring-offset-background focus:ring-2">
              <Icons id={priority.slug} type="priority" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-content">
              {priorities.map((priority) => (
                <DropdownMenuItem
                  key={priority.id}
                  className="bg-item flex items-center gap-2"
                  textValue={priority.title}
                  onSelect={async () => {
                    if (priority.id !== action.priority_id) {
                      // await handleActions({
                      //   ...action,
                      //   intent: INTENTS.updateAction,
                      //   priority_id: Number(priority.id),
                      // });

                      setAction({
                        ...action,
                        priority_id: priority.id,
                      });
                    }
                  }}
                >
                  <Icons
                    id={priority.slug}
                    type="priority"
                    className="h-4 w-4"
                  />
                  <span>{priority.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Responsáveis */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full border-none outline-none ring-ring ring-offset-4 ring-offset-background focus:ring-2">
              <div className="flex -space-x-2">
                {responsibles.map((person) => (
                  <Avatar
                    item={{
                      image: person.image,
                      short: person.initials!,
                    }}
                    key={person.id}
                    size="md"
                  />
                ))}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-content">
              {people.map((person) => (
                <DropdownMenuCheckboxItem
                  key={person.id}
                  className="bg-select-item flex items-center gap-2"
                  textValue={person.name}
                  checked={action.responsibles.includes(person.user_id)}
                  onCheckedChange={async (checked) => {
                    if (!checked && action.responsibles.length < 2) {
                      alert(
                        "É necessário ter pelo menos um responsável pala ação",
                      );
                      return false;
                    }
                    const tempResponsibles = checked
                      ? [...action.responsibles, person.user_id]
                      : action.responsibles.filter(
                          (id) => id !== person.user_id,
                        );

                    // await handleActions({
                    //   ...action,
                    //   intent: INTENTS.updateAction,
                    //   responsibles: tempResponsibles,
                    // });

                    setAction({
                      ...action,
                      responsibles: tempResponsibles,
                    });
                  }}
                >
                  <Avatar
                    item={{
                      image: person.image,
                      short: person.initials!,
                    }}
                  />
                  <span>{`${person.name} ${person.surname}`}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between pb-4">
          <div className=" ">
            <Popover>
              <PopoverTrigger asChild tabIndex={-7}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 flex items-center gap-2 focus-visible:ring-offset-0"
                >
                  <CalendarIcon className="size-4" />
                  <span>
                    {format(
                      date,
                      "d 'de' MMMM 'de' yyyy 'às' H'h'".concat(
                        date.getMinutes() > 0 ? "m" : "",
                      ),
                      {
                        locale: ptBR,
                      },
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-content">
                <Calendar
                  mode="single"
                  selected={parseISO(action.date)}
                  locale={ptBR}
                  onSelect={(date) => {
                    if (date) {
                      date?.setHours(
                        parseISO(action.date).getHours(),
                        parseISO(action.date).getMinutes(),
                      );

                      setAction({
                        ...action,
                        date: format(date, "yyyy-MM-dd HH:mm:ss"),
                      });
                    }
                  }}
                />
                <div className="mx-auto flex w-40 gap-2">
                  <Select
                    value={parseISO(action.date).getHours().toString()}
                    onValueChange={(value) => {
                      const date = parseISO(action.date);
                      date.setHours(Number(value));
                      setAction({
                        ...action,
                        date: format(date, "yyyy-MM-dd HH:mm:ss"),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array(24)
                        .fill(0)
                        .map((i, j) => {
                          return (
                            <SelectItem value={j.toString()} key={j}>
                              {j.toString()}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <Select
                    value={parseISO(action.date).getMinutes().toString()}
                    onValueChange={(value) => {
                      const date = parseISO(action.date);
                      date.setMinutes(Number(value));
                      setAction({
                        ...action,
                        date: format(date, "yyyy-MM-dd HH:mm:ss"),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array(60)
                        .fill(0)
                        .map((i, j) => {
                          return (
                            <SelectItem value={j.toString()} key={j}>
                              {j.toString()}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button
              variant={"ghost"}
              onClick={() => {
                if (
                  confirm(
                    "ESSA AÇÃO NÃO PODE SER DESFEITA! Deseja mesmo deletar essa ação?",
                  )
                ) {
                  handleActions({
                    ...action,
                    intent: INTENTS.deleteAction,
                  });

                  navigate(-1);
                }
              }}
            >
              <Trash2Icon className="size-4" />
            </Button>
            <Button
              onClick={() => {
                handleActions({
                  ...action,
                  responsibles: action.responsibles,
                  intent: INTENTS.updateAction,
                });
              }}
              disabled={isWorking}
            >
              {isWorking ? <Loader size="sm" /> : "Atualizar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
