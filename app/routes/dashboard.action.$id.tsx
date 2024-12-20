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
  data,
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@vercel/remix";
import { format, formatDistanceToNow, isSameMonth, parseISO } from "date-fns";

import { ptBR } from "date-fns/locale";
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  ImageIcon,
  Link2Icon,
  SaveIcon,
  SparklesIcon,
  Trash,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone-esm";
import invariant from "tiny-invariant";

import Tiptap from "~/components/structure/Tiptap";

import ButtonCNVT from "~/components/structure/Button";
import {
  DateTimeAndInstagramDate,
  ResponsibleForAction,
  StateSelect,
} from "~/components/structure/CreateAction";
import { Button } from "~/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ToastAction } from "~/components/ui/toast";
import { useToast } from "~/components/ui/use-toast";
import { INTENTS, TRIGGERS } from "~/lib/constants";
import {
  Avatar,
  AvatarGroup,
  Content,
  getInstagramFeed,
  getPartners,
  getTypeOfTheContent,
  Icons,
  isInstagramFeed,
  LikeFooter,
} from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };
const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { supabase } = createClient(request);
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

  return { action };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const filenames = String(formData.get("filenames")).split(",");
  const partner = formData.get("partner") as string;
  try {
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

        return { downloadUrl, status: response.statusText };
      }),
    );

    return { urls: urls.map((url) => url.downloadUrl) };
  } catch (error) {
    console.log(error);
  }

  return {};
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
  const [trigger, setTrigger] = useState("Autoridade");
  const [files, setFiles] = useState<{
    previews: { type: string; preview: string }[];
    files: string[];
  } | null>(null);

  const submit = useSubmit();
  const matches = useMatches();

  const { categories, partners, people, priorities, states, areas } = matches[1]
    .data as DashboardRootType;

  const partner = partners.find(
    (partner) => partner.slug === action.partners[0],
  ) as Partner;
  const actionPartners = getPartners(action.partners);
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

  // Atualizar a Inserir o conteúdo da IA
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
        ["carousel", "develop", "hook", "reels"].find(
          (category) => category === fetcher.formData?.get("intent"),
        )
      ) {
        setAction(() => ({
          ...action,
          description: (action.description || "").concat(
            `<h2>βIA às ${format(new Date(), "HH:mm:ss")}</h2> ${(fetcher.data as { message: string }).message}`,
          ),
        }));
      } else if (
        fetcher.formData?.get("intent") === "caption" ||
        fetcher.formData?.get("intent") === "stories"
      ) {
        setAction({
          ...action,
          caption: (fetcher.data as { message: string }).message,
        });
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (data) {
      setAction({ ...action, files: data.urls });
    }
  }, [data]);

  return (
    <div className="container mx-auto flex h-full max-w-5xl flex-col p-0 lg:overflow-hidden">
      <div className="gap-4 overflow-y-auto px-4 pt-4 md:px-8 lg:flex lg:h-full lg:overflow-hidden">
        <div
          className={`mb-4 flex w-full flex-col lg:h-full ${isInstagramFeed(action.category, true) ? "lg:w-3/5" : ""}`}
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
            <div className="text-secondary-foreground text-xs">
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
              className={`field-sizing-content w-full resize-none overflow-hidden border-none bg-transparent p-0 py-2 text-3xl leading-[85%] font-bold tracking-tighter outline-hidden ${action.title.length > 30 ? "md:text-5xl" : "md:text-6xl"}`}
              rows={1}
              onChange={(event) =>
                setAction({ ...action, title: event.target.value })
              }
            />

            <Button
              className={`mr-1 h-12 w-12 rounded p-1 ${isWorking && fetcher.formData?.get("intent") === "title" && "animate-colors"}`}
              variant="ghost"
              title="Gerar título"
              onClick={async () => {
                fetcher.submit(
                  {
                    title: action.title,
                    description: action.description,
                    context: `EMPRESA: ${partner.title} - DESCRIÇÃO: ${partner.context}`,
                    intent: "title",
                    voice: partner.voice,
                  },
                  {
                    action: "/handle-openai",
                    method: "post",
                  },
                );
              }}
            >
              <SparklesIcon className="size-4" />
            </Button>
          </div>

          {/* Descrição */}
          <div className="flex shrink grow flex-col overflow-hidden lg:mb-0">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-4 pt-1 pr-1">
              <div className="text-xs font-bold tracking-wider uppercase">
                Descrição
              </div>

              {action.category === "carousel" ? (
                <div className="flex gap-2">
                  <Triggers setTrigger={setTrigger} trigger={trigger} />
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
                              trigger,
                              voice: partner.voice,
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
                              trigger,
                              voice: partner.voice,
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
                </div>
              ) : action.category === "reels" ? (
                <div className="flex gap-2">
                  <Triggers setTrigger={setTrigger} trigger={trigger} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size={"sm"}
                        className={` ${
                          isWorking &&
                          ["hook", "reels"].find(
                            (category) =>
                              category === fetcher.formData?.get("intent"),
                          ) &&
                          "animate-colors"
                        }`}
                        variant="ghost"
                      >
                        <SparklesIcon className="size-4" />
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
                              context: `EMPRESA: ${partner.title} - CONTEXTO: ${partner.context}`,
                              intent: "hook",
                            },

                            {
                              action: "/handle-openai",
                              method: "post",
                            },
                          );
                        }}
                      >
                        Opções de ganchos virais
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="bg-item"
                        onSelect={async () => {
                          fetcher.submit(
                            {
                              title: action.title,
                              description: action.description,
                              context: `EMPRESA: ${partner.title} - CONTEXTO: ${partner.context}`,
                              intent: "reels",
                              model: "viral",
                              trigger,
                              voice: partner.voice,
                            },

                            {
                              action: "/handle-openai",
                              method: "post",
                            },
                          );
                        }}
                      >
                        Roteiro de Vídeo Viral
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="bg-item"
                        onSelect={async () => {
                          fetcher.submit(
                            {
                              title: action.title,
                              description: action.description,
                              context: `EMPRESA: ${partner.title} - CONTEXTO: ${partner.context}`,
                              intent: "reels",
                              model: "list",
                              trigger,
                              voice: partner.voice,
                            },

                            {
                              action: "/handle-openai",
                              method: "post",
                            },
                          );
                        }}
                      >
                        Roteiro de Vídeo em Lista
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex gap-2">
                  {action.category === "post" && (
                    <Triggers setTrigger={setTrigger} trigger={trigger} />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size={"sm"}
                        className={` ${isWorking && fetcher.formData?.get("intent") === "develop" && "animate-colors"}`}
                        variant="ghost"
                      >
                        <SparklesIcon className="size-4" />
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
                              context: `EMPRESA: ${partner.title} - CONTEXTO: ${partner.context}`,
                              intent: "develop",
                            },

                            {
                              action: "/handle-openai",
                              method: "post",
                            },
                          );
                        }}
                      >
                        Pesquisar sobre o assunto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
        {isInstagramFeed(action.category, true) ? (
          <div className="relative flex h-full flex-col overflow-hidden lg:w-2/5">
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
                        <div className="from-background/80 grid h-full w-full place-content-center bg-linear-to-b">
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
                <LikeFooter liked={state.slug === "finished"} />
              </div>
            )}
            {/* Legenda */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold tracking-wider uppercase">
                {action.category === "stories" ? "Sequência" : "Legenda"}
              </div>
              <div className="flex gap-2 pr-1 pb-1">
                <Triggers trigger={trigger} setTrigger={setTrigger} />

                {action.category === "stories" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className={`${isWorking && fetcher.formData?.get("intent") === "stories" && "animate-colors"}`}
                        variant="ghost"
                        title="Gerar Stories"
                      >
                        <SparklesIcon className="size-4" />
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
                              voice: partner.voice,
                              model: "static",
                              trigger: trigger,
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
                              voice: partner.voice,
                              model: "video",
                              trigger: trigger,
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
                  <div className="flex gap-1">
                    {action.caption && action.caption.length > 0 && (
                      <div className="flex gap-1">
                        <Button
                          variant={"ghost"}
                          size="sm"
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
                          <ChevronsDownUpIcon className="size-4" />
                        </Button>
                        <Button
                          variant={"ghost"}
                          size={"sm"}
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
                          <ChevronsUpDownIcon className="size-4" />
                        </Button>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className={` ${isWorking && fetcher.formData?.get("intent") === "caption" && "animate-colors"}`}
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
                                trigger: trigger,
                                voice: partner.voice,
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
                                trigger: trigger,
                                voice: partner.voice,
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
                                trigger: trigger,
                                voice: partner.voice,
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
                                trigger: trigger,
                                voice: partner.voice,
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
                                trigger: trigger,
                                voice: partner.voice,
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
                                trigger: trigger,
                                voice: partner.voice,
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
                        <DropdownMenuItem
                          onSelect={async () => {
                            fetcher.submit(
                              {
                                title: action.title,
                                description: action.description,
                                intent: "caption",
                                model: "long-tip",
                                trigger: trigger,
                                voice: partner.voice,
                              },
                              {
                                action: "/handle-openai",
                                method: "post",
                              },
                            );
                          }}
                        >
                          Legenda Longa e com dicas.
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
            <div className="h-full w-full">
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
                className={`scrollbars scrollbars-thin w-full text-sm font-normal outline-hidden transition ${isInstagramFeed(action.category) ? "border-0 focus-within:ring-0" : ""}`}
                //@ts-ignore

                value={action.caption ? action.caption : undefined}
              ></textarea>
            </div>
          </div>
        ) : null}
      </div>
      {/* Lower bar */}
      <div className="items-center justify-between overflow-hidden border-t p-4 md:flex md:px-8 lg:border-none">
        {/* Parceiros Categorias States Prioridade Responsável Cores */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 lg:gap-4">
          {/* Partners */}
          <DropdownMenu>
            <DropdownMenuTrigger className="button-trigger">
              {action.partners?.length > 0 ? (
                <AvatarGroup
                  size="md"
                  avatars={actionPartners.map((partner) => ({
                    item: {
                      short: partner.short,
                      bg: partner.colors[0],
                      fg: partner.colors[1],
                      title: partner.title,
                    },
                  }))}
                />
              ) : (
                "Parceiros"
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
              {partners.map((partner) => (
                <DropdownMenuCheckboxItem
                  key={partner.id}
                  checked={action.partners.includes(partner.slug)}
                  className="bg-select-item"
                  onCheckedChange={(checked) => {
                    const tempPartners = checked
                      ? [...action.partners, partner.slug]
                      : action.partners.filter((p) => p !== partner.slug);

                    setAction({
                      ...action,
                      partners: tempPartners,
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      item={{
                        short: partner.short,
                        bg: partner.colors[0],
                        fg: partner.colors[1],
                      }}
                    />
                    <div>{partner.title}</div>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Categoria */}

          <DropdownMenu>
            <DropdownMenuTrigger className="button-trigger button-trigger__squared">
              <Icons id={category.slug} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass">
              {areas.map((area, i) => (
                <DropdownMenuGroup key={area.id}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <h4 className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-50">
                    {area.title}
                  </h4>
                  {categories.map((category) =>
                    category.area === area.slug ? (
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

          <StateSelect
            state={action.state}
            onValueChange={(state) => {
              if (state !== action.state) {
                setAction({
                  ...action,
                  state,
                });
              }
            }}
          />

          {/* Prioridade */}

          <DropdownMenu>
            <DropdownMenuTrigger className="button-trigger button-trigger__squared">
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

          <ResponsibleForAction
            size="md"
            action={action}
            onCheckedChange={(responsibles) => {
              setAction({ ...action, responsibles });
            }}
          />

          {getInstagramFeed({ actions: [action] }).length > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="button-trigger button-trigger__squared">
                  <div
                    className="size-6 rounded-[8px] border"
                    style={{
                      backgroundColor: action.color
                        ? action.color
                        : actionPartners[0].colors[0],
                    }}
                  ></div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass">
                  {actionPartners[0].colors.map(
                    (color, i) =>
                      i !== 1 && (
                        <DropdownMenuItem
                          key={i}
                          onSelect={() => {
                            setAction({ ...action, color });
                          }}
                        >
                          <div
                            className="h-4 w-full rounded-[4px] border"
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
                className="button-trigger"
              >
                <Link2Icon className="size-6" />
              </Button>
            </>
          ) : null}
        </div>
        {/* Data / Deletar / Atualizar */}
        <div className="mt-4 flex items-center justify-between gap-2 overflow-hidden p-1 md:my-0">
          <DateTimeAndInstagramDate
            action={{
              ...action,
              date: parseISO(action.date),
              instagram_date: parseISO(action.instagram_date),
            }}
            onChange={({ date, instagram_date, time }) => {
              if (date)
                setAction({
                  ...action,
                  date: format(date, "yyyy-MM-dd HH:mm:ss"),
                });
              if (instagram_date)
                setAction({
                  ...action,
                  instagram_date: format(instagram_date, "yyyy-MM-dd HH:mm:ss"),
                });
              if (time) setAction({ ...action, time });
            }}
          />

          <div className="flex items-center gap-2">
            <Button
              variant={"ghost"}
              className="button-trigger__squared button-trigger"
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
                <div className="border-foreground size-4 animate-spin rounded-full border-2 border-b-transparent"></div>
              ) : (
                <>
                  <SaveIcon className="size-4" />
                  <span>Atualizar</span>
                </>
              )}
            </ButtonCNVT>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Triggers = ({
  trigger,
  setTrigger,
}: {
  trigger: string;
  setTrigger: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <Select value={trigger} onValueChange={(value) => setTrigger(value)}>
    <SelectTrigger
      className="h-auto gap-1 px-3 py-0.5 text-xs"
      title="Gatilho Mental"
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="glass">
      {TRIGGERS.map((trigger) => (
        <SelectItem key={trigger.value} value={trigger.value}>
          {trigger.value}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
