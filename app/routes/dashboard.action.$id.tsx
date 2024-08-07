import {
  Link,
  useFetcher,
  useFetchers,
  useLoaderData,
  useMatches,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@vercel/remix";
import { format, formatDistanceToNow, parseISO } from "date-fns";

import { ptBR } from "date-fns/locale";
import {
  ArrowDownNarrowWideIcon,
  ArrowUpNarrowWideIcon,
  CalendarIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { act, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import Loader from "~/components/structure/Loader";
import Tiptap from "~/components/structure/Tiptap";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
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
import { Textarea } from "~/components/ui/textarea";
import { CATEGORIES, INTENTS } from "~/lib/constants";
import { Avatar, Icons, InstagramFeedContent } from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };

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

  const submit = useSubmit();
  const matches = useMatches();

  const { categories, partners, people, priorities, states, areas } = matches[1]
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
      { ...data, updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss") },
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
  const fetcher = useFetcher();
  const caption = useRef<HTMLTextAreaElement>(null);

  const isWorking =
    navigation.state !== "idle" ||
    fetchers.filter((f) => f.formData).length > 0;

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.formData?.get("intent") === "title") {
        setAction(() => ({
          ...action,
          title: (action.title.indexOf(" | ") > 0
            ? action.title.substring(0, action.title.indexOf(" | "))
            : action.title
          )
            .concat(" | ")
            .concat((fetcher.data as { message: string }).message),
        }));
      } else if (fetcher.formData?.get("intent") === "carousel") {
        setAction(() => ({
          ...action,
          description: `${action.description}<hr/>${(fetcher.data as { message: string }).message}`,
        }));
      } else {
        setAction({
          ...action,
          caption: (fetcher.data as { message: string }).message,
        });

        setTimeout(() => {
          if (caption.current)
            caption.current.style.height =
              caption.current?.scrollHeight + 10 + "px";
        }, 100);
      }
    }
  }, [fetcher.data]);

  return (
    <div className="container flex h-full max-w-5xl flex-col px-4 md:px-8 lg:overflow-hidden">
      {/* Header */}
      {/* <div className=" container flex w-full shrink grow-0 items-center justify-between p-4 text-sm">
        
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
              className="font-extrabold tracking-tight transition"
            >
              {partner.title}
            </Link>
          </div>
        </div>
      </div> */}

      {/* Título */}
      <div className="flex justify-between gap-2">
        <div
          contentEditable="true"
          dangerouslySetInnerHTML={{
            __html: action.title,
          }}
          onBlur={(e) =>
            setAction({
              ...action,
              title: e.currentTarget.innerText,
            })
          }
          className={`bg-transparent py-2 font-extrabold tracking-tighter outline-none transition ${action.title.length < 50 ? "text-5xl" : "text-4xl"}`}
          onPaste={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setAction({
              ...action,
              title: e.clipboardData.getData("text"),
            });
          }}
        />
        <Button
          className={`h-7 w-7 rounded p-1 ${isWorking && fetchers.filter((fetcher) => fetcher.formData?.get("carousel") === "caption").length > 0 && "animate-colors"}`}
          variant="ghost"
          onClick={async () => {
            fetcher.submit(
              {
                title:
                  action.title.indexOf(" | ") > 0
                    ? action.title.substring(0, action.title.indexOf(" | "))
                    : action.title,
                description: action.description,
                context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                intent: "title",
              },
              {
                action: "/handle-openai",
                method: "post",
                navigate: false,
              },
            );
          }}
        >
          <SparklesIcon />
        </Button>
      </div>
      {/* Tempo */}
      <div className="mb-8 flex gap-4 text-sm leading-none">
        <div
          className="text-secondary-foreground"
          style={{ fontStretch: "75%" }}
        >
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

        <Link className="font-bold" to={`/dashboard/${partner.slug}`}>
          {partner.title}
        </Link>
      </div>

      <div className="justify-center gap-4 p-1 lg:flex lg:h-full lg:overflow-hidden">
        {/* Descrição */}
        <div className="mb-8 flex shrink grow flex-col overflow-hidden lg:mb-0 lg:w-3/5">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-4">
            <div className="text-xs font-extrabold uppercase tracking-wider">
              Descrição
            </div>

            {action.category_id === CATEGORIES.carousel && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className={`h-7 w-7 rounded p-1 ${isWorking && fetchers.filter((fetcher) => fetcher.formData?.get("carousel") === "caption").length > 0 && "animate-colors"}`}
                    variant="ghost"
                  >
                    <SparklesIcon />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="bg-content">
                  <DropdownMenuItem
                    className="bg-item"
                    onSelect={async () => {
                      fetcher.submit(
                        {
                          title: action.title,
                          description: action.description,
                          context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                          intent: "carousel",
                        },
                        {
                          action: "/handle-openai",
                          method: "post",
                          navigate: false,
                        },
                      );
                    }}
                  >
                    Modelo Comum
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="bg-item"
                    onSelect={async () => {
                      fetcher.submit(
                        {
                          title: action.title,
                          description: action.description,
                          context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                          intent: "carousel",
                          model: "twitter",
                        },
                        {
                          action: "/handle-openai",
                          method: "post",
                          navigate: false,
                        },
                      );
                    }}
                  >
                    Modelo Twitter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="relative flex h-full flex-col overflow-hidden pt-9">
            <div className="scrollbars scrollbars-thin">
              <Tiptap
                content={action.description}
                onBlur={(text) => {
                  setAction({ ...action, description: text });
                }}
              />
            </div>
          </div>
        </div>
        {/* Legenda e Arquivos */}
        <div
          className={`flex flex-col pb-1 lg:w-2/5 ${
            InstagramFeedContent.find(
              (content) => content === action.category_id,
            ) || action.category_id === CATEGORIES.stories
              ? ""
              : "hidden"
          }`}
        >
          <div className="mb-4 flex h-60 flex-col gap-4 lg:h-full">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider">
                {action.category_id === CATEGORIES.stories
                  ? "Sequência"
                  : "Legenda"}
              </div>
              <div>
                {action.category_id === CATEGORIES.stories ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className={`h-7 w-7 rounded p-1 ${isWorking && fetchers.filter((fetcher) => fetcher.formData?.get("carousel") === "stories").length > 0 && "animate-colors"}`}
                        variant="ghost"
                        title="Gerar Stories"
                      >
                        <SparklesIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-content">
                      <DropdownMenuItem
                        onSelect={async () => {
                          fetcher.submit(
                            {
                              title: action.title,
                              description: action.description,
                              context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                              intent: "stories",
                              model: "static",
                            },
                            {
                              action: "/handle-openai",
                              method: "post",
                              navigate: false,
                            },
                          );
                        }}
                      >
                        Roteiro de Stories estáticos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={async () => {
                          fetcher.submit(
                            {
                              title: action.title,
                              description: action.description,
                              context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                              intent: "stories",
                              model: "video",
                            },
                            {
                              action: "/handle-openai",
                              method: "post",
                              navigate: false,
                            },
                          );
                        }}
                      >
                        Roteiro de Stories em vídeo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex gap-4">
                    {action.caption && action.caption.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant={"ghost"}
                          className="h-8 w-8 p-1"
                          title="Reduzir o Texto"
                          onClick={async (event) => {
                            event.preventDefault();
                            event.stopPropagation();

                            fetcher.submit(
                              {
                                description: action.caption,
                                intent: "shrink",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                                navigate: false,
                              },
                            );
                          }}
                        >
                          <ArrowDownNarrowWideIcon className="size-4" />
                        </Button>
                        <Button
                          variant={"ghost"}
                          className="h-8 w-8 p-1"
                          title="Aumentar o texto"
                          onClick={async (event) => {
                            event.preventDefault();
                            event.stopPropagation();

                            fetcher.submit(
                              {
                                description: action.caption,
                                intent: "expand",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                                navigate: false,
                              },
                            );
                          }}
                        >
                          <ArrowUpNarrowWideIcon className="size-4" />
                        </Button>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className={`h-8 w-8 rounded p-1 ${isWorking && fetchers.filter((fetcher) => fetcher.formData?.get("intent") === "caption").length > 0 && "animate-colors"}`}
                          variant="ghost"
                          title="Gerar legenda"
                        >
                          <SparklesIcon className="size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onSelect={async () => {
                            fetcher.submit(
                              {
                                title: action.title,
                                description: action.description,
                                intent: "caption",
                                model: "short",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                                navigate: false,
                              },
                            );
                          }}
                        >
                          Legenda curta
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={async () => {
                            fetcher.submit(
                              {
                                title: action.title,
                                description: action.description,
                                intent: "caption",
                                model: "medium",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                                navigate: false,
                              },
                            );
                          }}
                        >
                          Legenda Média de Reforço
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={async () => {
                            fetcher.submit(
                              {
                                title: action.title,
                                description: action.description,
                                intent: "caption",
                                model: "long",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                                navigate: false,
                              },
                            );
                          }}
                        >
                          Legenda Longa e explicativa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>

            <Textarea
              ref={caption}
              name="caption"
              className="h-full text-base font-normal leading-tight"
              value={action.caption ? action.caption : ""}
              onChange={(event) =>
                setAction((action) => ({
                  ...action,
                  caption: event.target.value,
                }))
              }
            />
          </div>
          <Label className="flex flex-col text-xs font-extrabold tracking-wider">
            <div className="uppercase">Arquivos</div>
            <div className="mb-4 text-[12px] tracking-normal opacity-50">
              Coloque os arquivos separados por "," vírgula.
            </div>
            <Textarea
              name="files"
              className="text-base font-normal leading-tight tracking-tighter"
              value={action.files?.join(", ")}
              onChange={(event) =>
                setAction((action) => ({
                  ...action,
                  files: event.target.value.split(","),
                }))
              }
            />
          </Label>
        </div>
      </div>

      <div className="items-center justify-between p-4 md:flex">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 lg:gap-4">
          {/* Partners */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full border-none outline-none ring-ring ring-offset-2 ring-offset-background hover:bg-secondary focus:ring-2">
              <Avatar
                item={{
                  short: partner.short,
                  bg: partner.bg,
                  fg: partner.fg,
                }}
                size="md"
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
            <DropdownMenuTrigger className="rounded-full border-none p-2 outline-none ring-ring ring-offset-2 ring-offset-background hover:bg-secondary focus:ring-2">
              <Icons id={category.slug} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-content">
              {areas.map((area, i) => (
                <DropdownMenuGroup key={area.id}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <h4 className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-50">
                    {area.title}
                  </h4>
                  {categories.map((category) =>
                    category.area_id === area.id ? (
                      <DropdownMenuItem
                        key={category.id}
                        className="bg-item flex items-center gap-2"
                        onSelect={async () => {
                          if (category.id !== action.category_id) {
                            setAction({
                              ...action,
                              category_id: category.id,
                            });
                          }
                        }}
                      >
                        <Icons
                          id={category.slug}
                          className={`size-4 opacity-50`}
                        />
                        <span>{category.title}</span>
                      </DropdownMenuItem>
                    ) : null,
                  )}
                </DropdownMenuGroup>
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
            <DropdownMenuTrigger className="rounded-full border-none p-2 outline-none ring-ring ring-offset-2 ring-offset-background hover:bg-secondary focus:ring-2">
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
              <div className="flex pl-1">
                {responsibles.map((person) => (
                  <Avatar
                    item={{
                      image: person.image,
                      short: person.initials!,
                    }}
                    key={person.id}
                    size="md"
                    group
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

        <div className="mb-10 flex items-center justify-between md:mb-0">
          <div>
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
              {isWorking ? <Loader size="sm" colors={false} /> : "Atualizar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
