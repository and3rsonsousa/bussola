import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useFetchers,
  useLoaderData,
  useMatches,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  type ActionFunctionArgs,
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@vercel/remix";
import {
  format,
  formatDistanceToNow,
  formatDuration,
  isSameMonth,
  parseISO,
} from "date-fns";

import { ptBR } from "date-fns/locale";
import {
  ArrowDownNarrowWideIcon,
  ArrowUpNarrowWideIcon,
  CalendarIcon,
  ImageIcon,
  Link2Icon,
  MessageCircleIcon,
  SaveIcon,
  SendIcon,
  SparklesIcon,
  Trash,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone-esm";
import invariant from "tiny-invariant";

import Tiptap from "~/components/structure/Tiptap";

import ButtonCNVT from "~/components/structure/Button";
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
import { ToastAction } from "~/components/ui/toast";
import { useToast } from "~/components/ui/use-toast";
import { INTENTS } from "~/lib/constants";
import {
  Avatar,
  Content,
  getInstagramFeed,
  getTypeOfTheContent,
  Heart,
  Icons,
  isInstagramFeed,
} from "~/lib/helpers";
import { createClient } from "~/lib/supabase";
import { Input } from "~/components/ui/input";
import { formatActionTime } from "~/components/structure/CreateAction";

export const config = { runtime: "edge" };
const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { headers, supabase } = createClient(request);
  const { id } = params;

  if (!id) throw new Error("$id não foi definido");

  const { data: action } = await supabase
    .from("actions")
    .select("*")
    .is("archived", false)
    .eq("id", id)
    .returns<Action[]>()
    .single();

  invariant(action);

  return json({ headers, action });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const filenames = String(formData.get("filenames")).split(",");
  const partner = formData.get("partner") as string;
  // const title = formData.get("title") as string;

  const urls = await Promise.all(
    files.map(async (file, i) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileUrl = `${partner}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${format(new Date(), "yyyy-MM-dd_hh-mm-ss")}_${i}${filenames[i].substring(filenames[i].lastIndexOf("."))}`;
      const url = `https://br.storage.bunnycdn.com/agencia-cnvt/${fileUrl}`;
      const downloadUrl = `https://agenciacnvt.b-cdn.net/${fileUrl}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          AccessKey: ACCESS_KEY!,
          "Content-Type": "application/octet-stream",
        },
        body: buffer,
      });

      return downloadUrl;
    }),
  );

  return json({ urls });
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
  const data = useActionData<{ urls: string[] }>();

  const [action, setAction] = useState(baseAction);
  const [files, setFiles] = useState<{
    previews: { type: string; preview: string }[];
    files: string[];
  } | null>(null);

  const submit = useSubmit();
  const matches = useMatches();

  const { categories, partners, people, priorities, states, areas } = matches[1]
    .data as DashboardRootType;

  const partner = partners.find(
    (partner) => partner.slug === action.partner,
  ) as Partner;
  const category = categories.find(
    (category) => category.slug === action.category,
  ) as Category;
  const state = states.find((state) => state.slug === action.state) as State;
  const priority = priorities.find(
    (priority) => priority.slug === action.priority,
  ) as Priority;
  const responsibles: Person[] = [];
  action.responsibles?.filter((user_id) =>
    responsibles.push(
      people.find((person) => person.user_id === user_id) as Person,
    ),
  );
  const date = parseISO(action.date);

  const handleActions = (data: {
    [key: string]: string | number | string[] | null | boolean;
  }) => {
    submit(
      {
        ...data,
        updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
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
  const { toast } = useToast();
  const fetcher = useFetcher({ key: "action-page" });
  const caption = useRef<HTMLTextAreaElement>(null);
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles({
        previews: acceptedFiles.map((f) => ({
          preview: URL.createObjectURL(f),
          type: getTypeOfTheContent(f.name),
        })),
        files: acceptedFiles.map((f) => f.name),
      });
    },
  });

  const isWorking =
    navigation.state !== "idle" ||
    fetchers.filter((f) => f.formData).length > 0;

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.formData?.get("intent") === "title") {
        setAction(() => ({
          ...action,
          title: (action.title.indexOf(" | ") >= 0
            ? action.title.substring(0, action.title.indexOf(" | "))
            : action.title
          )
            .concat(" | ")
            .concat((fetcher.data as { message: string }).message),
        }));
      } else if (
        ["carousel", "develop"].find(
          (category) => category === fetcher.formData?.get("intent"),
        )
      ) {
        setAction(() => ({
          ...action,
          description: `${action.description && action.description.indexOf("[---BIA---]") >= 0 ? action.description?.substring(0, action.description?.indexOf("<br/>[---BIA---]")) : action.description}<br/>[---BIA---]${(fetcher.data as { message: string }).message}`,
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

  useEffect(() => {
    if (data) {
      setAction({ ...action, files: data.urls });
    }
  }, [data]);

  return (
    <div className="container flex h-full max-w-5xl flex-col p-0 lg:overflow-hidden">
      <div className="gap-4 overflow-y-auto px-4 pt-4 md:px-8 lg:flex lg:h-full lg:overflow-hidden">
        <div
          className={`mb-4 flex w-full flex-col lg:h-full ${isInstagramFeed(action.category) ? "lg:w-4/6" : ""}`}
        >
          {/* Header */}
          <div className="flex w-full shrink grow-0 items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Avatar
                item={{
                  short: partner.short,
                  bg: partner.colors[0],
                  fg: partner.colors[1],
                }}
                size="md"
                style={{
                  viewTransitionName: "avatar-partner",
                }}
              />
              <div>
                <Link
                  to={`/dashboard/${partner.slug}${!isSameMonth(action.date, new Date()) ? `?date=${format(action.date, "yyyy-MM-dd")}` : ""}`}
                  className="cursor-pointer font-bold tracking-tight"
                >
                  {partner.title}
                </Link>
              </div>
            </div>
            <div className="text-xs text-secondary-foreground">
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

          {/* Título */}
          <div className="flex gap-4">
            <textarea
              value={action.title}
              className={`w-full overflow-hidden border-none bg-transparent p-0 py-2 text-3xl font-bold outline-none ${action.title.length > 50 ? "md:text-4xl" : "md:text-5xl"}`}
              rows={1}
              // @ts-ignore
              style={{ fieldSizing: "content", resize: "none" }}
              onChange={(event) =>
                setAction({ ...action, title: event.target.value })
              }
            />

            <Button
              className={`mr-1 h-12 w-12 rounded p-1 ${isWorking && fetcher.formData?.get("intent") === "title" && "animate-colors"}`}
              variant="ghost"
              title="Gerar legenda"
              onClick={async () => {
                fetcher.submit(
                  {
                    title: action.title,
                    description: action.description,
                    context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                    intent: "title",
                  },
                  {
                    action: "/handle-openai",
                    method: "post",
                  },
                );
              }}
            >
              <SparklesIcon className="size-6" />
            </Button>
          </div>

          {/* Descrição */}
          <div className="flex shrink grow flex-col overflow-hidden lg:mb-0">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-4 pr-1 pt-1">
              <div className="text-xs font-bold uppercase tracking-wider">
                Descrição
              </div>

              {action.category === "carousel" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className={`h-7 w-7 p-1 ${isWorking && fetcher.formData?.get("intent") === "carousel" && "animate-colors"}`}
                      variant="ghost"
                    >
                      <SparklesIcon />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="glass">
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
                          },
                        );
                      }}
                    >
                      Modelo Twitter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  className={`h-7 w-7 p-1 ${isWorking && fetcher.formData?.get("intent") === "develop" && "animate-colors"}`}
                  variant="ghost"
                  onClick={async () => {
                    fetcher.submit(
                      {
                        title: action.title,
                        description: action.description,
                        context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                        intent: "develop",
                      },

                      {
                        action: "/handle-openai",
                        method: "post",
                      },
                    );
                  }}
                >
                  <SparklesIcon />
                </Button>
              )}
            </div>
            <div className="relative flex h-full flex-col overflow-hidden">
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
        </div>

        {/* Arquivos e Legenda */}
        {isInstagramFeed(action.category) || action.category === "stories" ? (
          <div className="lg:scrollbars flex flex-col lg:w-2/6">
            {/* Arquivo */}
            {action.category !== "stories" && (
              <div>
                <Form method="post" encType="multipart/form-data">
                  <div className="relative min-h-[50px] overflow-hidden rounded">
                    <Content
                      action={{
                        ...action,
                        previews: files ? files.previews : null,
                      }}
                      aspect="feed"
                      partner={partner}
                    />

                    <div
                      {...getRootProps()}
                      className="absolute top-0 h-[calc(100%-60px)] w-full"
                    >
                      <input
                        name="partner"
                        hidden
                        defaultValue={partner.slug}
                      />
                      <input
                        name="filenames"
                        hidden
                        defaultValue={files?.files}
                      />
                      <input
                        name="title"
                        hidden
                        defaultValue={action.title
                          .toLocaleLowerCase()
                          .replace(/\s/g, "-")
                          .replace(/[^0-9a-z-]/g, "")}
                      />
                      <input {...getInputProps()} name="files" multiple />

                      {isDragActive ? (
                        <div className="grid h-full w-full place-content-center bg-gradient-to-b from-background/80">
                          <ImageIcon className="size-12 opacity-75" />
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-end gap-2 p-2 text-right text-xs text-white"
                          style={{
                            textShadow: "rgba(0,0,0,0.5) 0px 1px 3px",
                          }}
                        >
                          Arraste seus arquivos para cá.
                          {(action.files || files) && (
                            <>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  event.preventDefault();
                                  setAction({ ...action, files: null });
                                  setFiles(null);
                                }}
                                className="grid h-6 w-6 place-content-center rounded-sm bg-black/25 p-1"
                              >
                                <Trash className="size-4" />
                              </button>
                              <button
                                type="submit"
                                onClick={(event) => {
                                  event.stopPropagation();
                                }}
                                className="grid h-6 w-6 place-content-center rounded-sm bg-black/25 p-1"
                              >
                                <SaveIcon className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Form>
                <div className="flex gap-4 py-2">
                  <Heart />
                  <MessageCircleIcon className="size-6" />
                  <SendIcon className="size-6" />
                </div>
              </div>
            )}
            {/* Legenda */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider">
                {action.category === "stories" ? "Sequência" : "Legenda"}
              </div>
              <div className="pb-1 pr-1">
                {action.category === "stories" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className={`h-7 w-7 p-1 ${isWorking && fetcher.formData?.get("intent") === "stories" && "animate-colors"}`}
                        variant="ghost"
                        title="Gerar Stories"
                      >
                        <SparklesIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="glass">
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
                          className={`h-8 w-8 p-1 ${isWorking && fetcher.formData?.get("intent") === "caption" && "animate-colors"}`}
                          variant="ghost"
                          title="Gerar legenda"
                        >
                          <SparklesIcon className="size-4" />
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
                                model: "aida",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                              },
                            );
                          }}
                        >
                          AIDA - Atenção, Interesse, Desejo e Ação
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={async () => {
                            fetcher.submit(
                              {
                                title: action.title,
                                description: action.description,
                                intent: "caption",
                                model: "slap",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                              },
                            );
                          }}
                        >
                          SLAP - Pare, Olhe, Aja e Converta.
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={async () => {
                            fetcher.submit(
                              {
                                title: action.title,
                                description: action.description,
                                intent: "caption",
                                model: "pas",
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                              },
                            );
                          }}
                        >
                          PAS - Problema, Agitação e Solução
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

            <textarea
              placeholder="Escreva sua legenda aqui ou peça à βIA para criar no botão superior direito."
              ref={caption}
              key={`caption-${action.id}`}
              name="caption"
              onChange={(event) =>
                setAction((action) => ({
                  ...action,
                  caption: event.target.value,
                }))
              }
              className={`scrollbars scrollbars-thin min-h-20 w-full bg-background font-normal leading-tight outline-none lg:text-sm ${isInstagramFeed(action.category) ? "border-0 focus-within:ring-0" : ""}`}
              //@ts-ignore
              style={{ fieldSizing: "content" }}
              defaultValue={action.caption ? action.caption : undefined}
            ></textarea>
          </div>
        ) : null}
      </div>

      <div className="items-center justify-between border-t p-4 md:flex md:px-8 lg:border-none">
        {/* Parceiros Categorias States Prioridade Responsável Cores */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 lg:gap-4">
          {/* Partners */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full border-none outline-none ring-ring ring-offset-2 ring-offset-background focus:ring-2">
              <Avatar
                item={{
                  short: partner.short,
                  bg: partner.colors[0],
                  fg: partner.colors[1],
                }}
                size="md"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
              {partners.map((partner) => (
                <DropdownMenuItem
                  key={partner.slug}
                  className="bg-item flex items-center gap-2"
                  textValue={partner.title}
                  onSelect={async () => {
                    if (partner.slug !== action.partner) {
                      setAction({
                        ...action,
                        partner: partner.slug,
                      });
                    }
                  }}
                >
                  <Avatar
                    item={{
                      short: partner.short,
                      bg: partner.colors[0],
                      fg: partner.colors[1],
                    }}
                  />
                  <span>{partner.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Categoria */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded border-none p-2 outline-none ring-ring ring-offset-2 ring-offset-background hover:bg-secondary focus:ring-2">
              <Icons id={category.slug} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
              {areas.map((area, i) => (
                <DropdownMenuGroup key={area.id}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <h4 className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-50">
                    {area.title}
                  </h4>
                  {categories.map((category) =>
                    category.area_id === area.id ? (
                      <DropdownMenuItem
                        key={category.slug}
                        className="bg-item flex items-center gap-2"
                        onSelect={async () => {
                          if (category.slug !== action.category) {
                            setAction({
                              ...action,
                              category: category.slug,
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
              className={`flex items-center rounded border-2 px-3 py-1 text-xs font-semibold outline-none ring-ring ring-offset-2 ring-offset-background focus:ring-2 lg:text-sm`}
              style={{ borderColor: state.color }}
            >
              {state.title}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
              {states.map((state) => (
                <DropdownMenuItem
                  key={state.slug}
                  className="bg-item flex items-center gap-2"
                  textValue={state.title}
                  onSelect={async () => {
                    if (state.slug !== action.state) {
                      setAction({
                        ...action,
                        state: state.slug,
                      });
                    }
                  }}
                >
                  <div
                    className={`my-1 size-2 rounded-full`}
                    style={{ backgroundColor: state.color }}
                  ></div>
                  <span>{state.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Prioridade */}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded border-none p-2 outline-none ring-ring ring-offset-2 ring-offset-background hover:bg-secondary focus:ring-2">
              <Icons id={priority.slug} type="priority" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
              {priorities.map((priority) => (
                <DropdownMenuItem
                  key={priority.slug}
                  className="bg-item flex items-center gap-2"
                  textValue={priority.title}
                  onSelect={async () => {
                    if (priority.slug !== action.priority) {
                      setAction({
                        ...action,
                        priority: priority.slug,
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
            <DropdownMenuTrigger className="flex -space-x-1 rounded-full border-none outline-none ring-ring ring-offset-2 ring-offset-background focus:ring-2">
              {responsibles.map((person, i) => (
                <Avatar
                  item={{
                    image: person.image,
                    short: person.initials!,
                  }}
                  key={person.id}
                  size="md"
                />
              ))}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
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
                    size="md"
                  />
                  <span>{`${person.name} ${person.surname}`}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {getInstagramFeed({ actions: [action] }).length > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded outline-none ring-primary ring-offset-4 ring-offset-background focus-within:ring-2">
                  <div
                    className="size-8 rounded border"
                    style={{
                      backgroundColor: action.color
                        ? action.color
                        : partner.colors[0],
                    }}
                  ></div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass">
                  {partner.colors.map(
                    (color, i) =>
                      i !== 1 && (
                        <DropdownMenuItem
                          key={i}
                          onSelect={() => {
                            setAction({ ...action, color });
                          }}
                        >
                          <div
                            className="h-4 w-full rounded-[4px]"
                            style={{ backgroundColor: color }}
                          ></div>
                        </DropdownMenuItem>
                      ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant={"ghost"}
                title="Gerar link de aprovação"
                onClick={() => {
                  const url = `https://bussola.cnvt.com.br/report/${partner.slug}?action=${action.id}`;
                  try {
                    navigator.clipboard.writeText(url);
                    toast({
                      description:
                        "O endereço da ação foi copiado para o clipboard.",
                      action: (
                        <ToastAction
                          altText="Ver Ação"
                          onClick={() => {
                            location.href = url;
                          }}
                        >
                          Ver Ação
                        </ToastAction>
                      ),
                    });
                  } catch (e) {
                    console.log(e);
                  }
                }}
              >
                <Link2Icon className="size-6" />
              </Button>
            </>
          ) : null}
        </div>
        {/* Data / Deletar / Atualizar */}
        <div className="mt-4 flex items-center justify-between gap-2 md:my-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"ghost"} className="-ml-4 gap-2">
                <CalendarIcon className="size-4" />
                <span className="lg:hidden">
                  {format(
                    date,
                    "d/MM/yyyy 'às' H'h'".concat(
                      date.getMinutes() > 0 ? "m" : "",
                    ),
                    {
                      locale: ptBR,
                    },
                  )}
                </span>
                <span className="hidden lg:block">
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
            <PopoverContent className="shadow-xl">
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
              <div className="mx-auto flex gap-2">
                <div className="flex shrink-0">
                  <Input
                    value={parseISO(action.date).getHours().toString()}
                    className="w-1/2 rounded-r-none border border-r-0 border-border text-right focus:z-10"
                    type="number"
                    min={0}
                    max={23}
                    onChange={(event) => {
                      const date = parseISO(action.date);
                      date.setHours(Number(event.target.value));
                      setAction({
                        ...action,
                        date: format(date, "yyyy-MM-dd HH:mm:ss"),
                      });
                    }}
                  />
                  <Input
                    value={parseISO(action.date).getMinutes().toString()}
                    className="w-1/2 rounded-l-none border border-l-0 border-border text-left"
                    type="number"
                    min={0}
                    max={59}
                    onChange={(event) => {
                      const date = parseISO(action.date);
                      date.setMinutes(Number(event.target.value));
                      setAction({
                        ...action,
                        date: format(date, "yyyy-MM-dd HH:mm:ss"),
                      });
                    }}
                  />
                  {/* <Select
                    value={
                      action.date ? action.date.getHours().toString() : "11"
                    }
                    onValueChange={(value) => {
                      if (action.date) {
                        const date = action.date;
                        date.setHours(Number(value));
                        setAction({
                          ...action,
                          date: date,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-1/4">
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
                  </Select> */}
                  {/* <Select
                    value={
                      action.date ? action.date.getMinutes().toString() : "12"
                    }
                    onValueChange={(value) => {
                      if (action.date) {
                        const date = action.date;
                        date.setMinutes(Number(value));
                        setAction({
                          ...action,
                          date: date,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-1/4">
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
                  </Select> */}
                </div>
                <Select
                  value={action.time.toString()}
                  onValueChange={(value) => {
                    setAction({ ...action, time: Number(value) });
                  }}
                >
                  <SelectTrigger className="w-full border border-border bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((i) => (
                      <SelectItem value={i.toString()} key={i}>
                        {formatActionTime(i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="mx-auto flex w-40 gap-2">
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
              </div> */}
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
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
            {/* <Button */}
            <ButtonCNVT
              onClick={() => {
                handleActions({
                  ...action,
                  responsibles: action.responsibles,
                  intent: INTENTS.updateAction,
                });
              }}
              disabled={isWorking}
            >
              {isWorking ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white border-b-transparent"></div>
              ) : (
                <span className="z-10">Salvar</span>
              )}
            </ButtonCNVT>
          </div>
        </div>
      </div>
    </div>
  );
}
