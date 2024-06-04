import {
  Form,
  Link,
  useMatches,
  useNavigate,
  useSubmit,
} from "@remix-run/react";
import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addWeeks,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isSameYear,
  parseISO,
} from "date-fns";

import { ptBR } from "date-fns/locale";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  ExpandIcon,
  PencilLineIcon,
  ShrinkIcon,
  TimerIcon,
  TrashIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "~/components/ui/context-menu";
import { CATEGORIES, INTENTS, PRIORITIES, STATES } from "~/lib/constants";
import {
  Avatar,
  Icons,
  amIResponsible,
  getActionsByPriority,
  getActionsByState,
  getResponsibles,
} from "~/lib/helpers";
import { cn } from "~/lib/utils";
import { Toggle } from "../ui/toggle";
import { Button } from "../ui/button";

export function ActionLine({
  action,
  showCategory,
  showDelay,
  partner,
  date,
  onDrag,
  short,
}: {
  action: Action;
  showCategory?: boolean;
  showDelay?: boolean;
  partner?: Partner;
  date?: { dateFormat?: 0 | 1 | 2 | 3 | 4; timeFormat?: 0 | 1 };
  onDrag?: (action: Action) => void;
  short?: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [isHover, setHover] = useState(false);
  const navigate = useNavigate();
  const submit = useSubmit();
  const matches = useMatches();

  const { states, categories, person } = matches[1].data as DashboardDataType;

  const state = states.find((state) => state.id === action.state_id) as State;

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleActions(data: {
    [key: string]: string | number | null | string[];
  }) {
    submit(
      { ...data },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          title={action.title}
          className={`group/action action-item items-center ${short ? "px-2 py-1" : "p-2"} text-sm font-medium @container md:text-xs ${
            edit ? "" : `cursor-text`
          } action-${state.slug} ${
            showDelay &&
            isBefore(action.date, new Date()) &&
            state.id !== STATES.finish
              ? "action-delayed"
              : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey && !edit) {
              navigate(`/dashboard/action/${action.id}`);
            } else {
              setEdit(true);
            }
          }}
          onMouseEnter={() => {
            setHover(true);
          }}
          onMouseLeave={() => {
            setHover(false);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={() => {}}
          draggable={!!onDrag}
          onDragEnd={() => {
            if (onDrag) onDrag(action);
          }}
        >
          {/* Atalhos */}
          {isHover && !edit ? <ShortcutActions action={action} /> : null}

          {partner && (
            <Avatar
              size="xs"
              item={{
                short: partner.short,
                bg: partner.bg,
                fg: partner.fg,
              }}
            />
          )}
          {showCategory && (
            <Icons
              id={
                categories.find(
                  (category) => category.id === action.category_id,
                )?.slug
              }
              className="hidden size-3 shrink-0 opacity-25 @[200px]:block"
            />
          )}

          <div className="relative w-full shrink overflow-hidden">
            {edit ? (
              <input
                ref={inputRef}
                type="text"
                name="title"
                style={{ fontStretch: "85%" }}
                defaultValue={action.title}
                className="w-full bg-transparent outline-none"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    flushSync(() => {
                      setEdit(() => false);
                    });
                    buttonRef.current?.focus();
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (inputRef.current?.value !== action.title) {
                      flushSync(() => {
                        handleActions({
                          intent: INTENTS.updateAction,
                          ...action,
                          title: String(inputRef.current?.value),
                        });
                      });

                      buttonRef.current?.focus();
                    }
                    setEdit(() => false);
                  }
                }}
                onBlur={(event) => {
                  event.preventDefault();
                  if (inputRef.current?.value !== action.title) {
                    flushSync(() => {
                      handleActions({
                        intent: INTENTS.updateAction,
                        ...action,
                        title: String(inputRef.current?.value),
                      });
                    });
                  }
                  setEdit(() => false);
                }}
              />
            ) : (
              <button
                ref={buttonRef}
                style={{ fontStretch: "85%" }}
                className={`block w-full cursor-text overflow-hidden text-ellipsis text-nowrap text-left outline-none`}
                onClick={() => {
                  flushSync(() => {
                    setEdit(true);
                  });
                  inputRef.current?.select();
                }}
              >
                {action.title}
              </button>
            )}
          </div>

          <div>
            {action.priority_id === PRIORITIES.high ? (
              <Icons id="high" className="size-3 text-red-500" />
            ) : null}
          </div>

          <div className="hidden @[200px]:flex">
            {amIResponsible(action.responsibles, person.user_id) && (
              <Avatar
                item={{
                  image: person.image,
                  short: person.initials!,
                }}
                size="xs"
              />
            )}
          </div>

          {date && (
            <div className="hidden shrink grow-0 whitespace-nowrap text-right text-xs opacity-25 @[200px]:block md:text-[10px]">
              {formatActionDatetime({
                date: action.date,
                dateFormat: date.dateFormat,
                timeFormat: date.timeFormat,
              })}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuItems action={action} handleActions={handleActions} />
    </ContextMenu>
  );
}

export function ActionRow({ action }: { action: Action }) {
  return;
}

export function ActionBlock({ action }: { action: Action }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = useSubmit();
  const [edit, setEdit] = useState(false);
  const [isHover, setHover] = useState(false);

  const matches = useMatches();
  const { categories, states, partners, person } = matches[1]
    .data as DashboardDataType;
  const partner = partners.find(
    (partner) => partner.id === action.partner_id,
  ) as Partner;

  const state = states.find((state) => state.id === action.state_id) as State;

  function handleActions(data: {
    [key: string]: string | number | null | string[];
  }) {
    submit(
      { ...data },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          title={action.title}
          className={`group/action action-item flex-col justify-between gap-2 overflow-hidden rounded-l-[4px] rounded-r border-l-4 px-4 py-2 text-sm border-${state.slug} @container`}
          onMouseEnter={() => {
            setHover(true);
          }}
          onMouseLeave={() => {
            setHover(false);
          }}
        >
          {isHover && !edit ? <ShortcutActions action={action} /> : null}
          {/* Title */}
          <div className="leading-tighter relative text-lg font-semibold">
            {edit ? (
              <Form
                method="POST"
                onSubmit={(event) => {
                  event.preventDefault();
                  flushSync(() => {
                    setEdit(false);
                    if (
                      inputRef.current?.value !== undefined &&
                      inputRef.current?.value !== action.title
                    ) {
                      handleActions({
                        intent: INTENTS.updateAction,
                        ...action,
                        title: inputRef.current?.value,
                      });
                    }
                  });
                  buttonRef.current?.focus();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  defaultValue={action.title}
                  style={{ fontStretch: "85%" }}
                  className={`w-full overflow-hidden bg-transparent outline-none`}
                  onBlur={() => {
                    if (
                      inputRef.current?.value !== undefined &&
                      inputRef.current?.value !== action.title
                    )
                      handleActions({
                        intent: INTENTS.updateAction,
                        ...action,
                        title: inputRef.current?.value,
                      });

                    setEdit(() => false);
                  }}
                />
              </Form>
            ) : (
              <button
                ref={buttonRef}
                style={{ fontStretch: "85%" }}
                className={`block w-full cursor-text overflow-hidden text-ellipsis text-nowrap text-left outline-none`}
                onClick={() => {
                  flushSync(() => {
                    setEdit(true);
                  });
                  inputRef.current?.focus();
                }}
              >
                {action.title}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              {partner ? (
                <Avatar
                  item={{
                    short: partner.short,
                    bg: partner.bg,
                    fg: partner.fg,
                  }}
                />
              ) : null}
              {/* Category - Categoria */}
              <div>
                <Icons
                  id={
                    categories.find(
                      (category) => category.id === action.category_id,
                    )?.slug
                  }
                  className="w-4"
                />
              </div>
              {/* Priority - Prioridade */}
              {action.priority_id === PRIORITIES.high ? (
                <div>
                  <Icons id={"high"} className="w-4" type="priority" />
                </div>
              ) : null}
              {/* Responsibles -  Responsáveis */}
              <div className="flex">
                {amIResponsible(action.responsibles, person.user_id) && (
                  <Avatar
                    item={{
                      image: person.image,
                      short: person.initials!,
                    }}
                    size="sm"
                    key={person.id}
                  />
                )}
              </div>
            </div>
            <div className="whitespace-nowrap text-right text-sm font-medium text-muted-foreground md:text-xs">
              <span className="@[200px]:hidden">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: 2,
                  timeFormat: 1,
                })}
              </span>
              <span className="hidden @[200px]:block @[300px]:hidden">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: 3,
                  timeFormat: 1,
                })}
              </span>
              <span className="hidden @[300px]:block">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: 4,
                  timeFormat: 1,
                })}
              </span>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuItems action={action} handleActions={handleActions} />
    </ContextMenu>
  );
}

export function ActionGrid({
  action,
  classNames,
}: {
  action: Action;
  classNames?: string;
}) {
  const submit = useSubmit();
  const matches = useMatches();
  const [isHover, setHover] = useState(false);
  const { states } = matches[1].data as DashboardDataType;

  function handleActions(data: {
    [key: string]: string | number | null | string[];
  }) {
    submit(
      { ...data },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`group/action relative flex aspect-square select-none flex-col items-center justify-between rounded-[4px] p-2 transition ${cn(
            classNames,
          )} ${
            action.state_id === STATES.finish
              ? "bg-secondary opacity-50"
              : "bg-secondary hover:bg-muted hover:text-secondary-foreground"
          }`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {isHover ? <ShortcutActions action={action} /> : null}
          <div></div>
          <div
            className={`line-clamp-2 overflow-hidden py-4 text-center leading-none tracking-tighter transition`}
            style={{ fontStretch: "85%" }}
          >
            {action.title}
          </div>
          <div className="flex items-center justify-center gap-2 leading-none">
            <div
              className={`h-2 w-2 rounded-full bg-${
                states.find((state) => state.id === action.state_id)?.slug
              }`}
            ></div>

            <div className="text-[10px] opacity-50">
              {format(parseISO(action.date), "E, d 'de' MMM", {
                locale: ptBR,
              })}
            </div>
          </div>
          <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-muted opacity-0 transition group-hover/action:opacity-100"></div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuItems action={action} handleActions={handleActions} />
    </ContextMenu>
  );
}

export function ListOfActions({
  actions,
  showCategory,
  date,
  columns = 1,
  onDrag,
  isFoldable,
  descending = false,
  orderBy = "state",
  short,
}: {
  actions?: Action[] | null;
  showCategory?: boolean;
  date?: { dateFormat?: 0 | 1 | 2 | 3 | 4; timeFormat?: 0 | 1 };
  columns?: 1 | 2 | 3 | 6;
  onDrag?: (action: Action) => void;
  isFoldable?: boolean;
  descending?: boolean;
  orderBy?: "state" | "priority" | "time";
  short?: boolean;
}) {
  actions = actions
    ? orderBy === "state"
      ? getActionsByState(actions, descending)
      : getActionsByPriority(actions, descending)
    : [];
  const matches = useMatches();
  const { states, categories, priorities, partners } = matches[1]
    .data as DashboardDataType;

  const foldCount = columns * 4;
  const [fold, setFold] = useState(isFoldable ? foldCount : undefined);
  return actions.length > 0 ? (
    <>
      <div
        className={`${
          columns === 1
            ? "flex flex-col"
            : columns === 2
              ? "grid sm:grid-cols-2"
              : columns === 3
                ? "grid sm:grid-cols-2 md:grid-cols-3"
                : "grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4  2xl:grid-cols-6"
        } gap-x-4 gap-y-1 @container`}
      >
        {actions
          ?.slice(0, fold)
          .map((action) => (
            <ActionLine
              short={short}
              key={action.id}
              action={action}
              showCategory={showCategory}
              partner={partners.find(
                (partner) => partner.id === action.partner_id,
              )}
              date={date}
              onDrag={onDrag}
            />
          ))}
      </div>
      {actions && isFoldable && actions.length > foldCount ? (
        <div className="p-4 text-center">
          <Toggle
            size={"sm"}
            onPressedChange={(isPressed) => {
              setFold(isPressed ? undefined : foldCount);
            }}
            className="inline-flex gap-2 text-xs uppercase tracking-wider"
          >
            {fold ? (
              <>
                <span>Exibir todos</span>
                <ExpandIcon className="size-4" />
              </>
            ) : (
              <>
                <span>Exibir menos</span>
                <ShrinkIcon className="size-4" />
              </>
            )}
          </Toggle>
        </div>
      ) : null}
    </>
  ) : null;
}

export function BlockOfActions({
  actions,
  max,
}: {
  actions?: Action[] | null;
  max?: 1 | 2;
}) {
  return (
    <div className="@container">
      <div
        className={`grid ${
          !max
            ? "@[500px]:grid-cols-2 @[750px]:grid-cols-3 @[1000px]:grid-cols-4 @[1300px]:grid-cols-6"
            : max === 2
              ? "grid-cols-2"
              : ""
        } gap-2`}
      >
        {actions?.map((action) => (
          <ActionBlock action={action} key={action.id} />
        ))}
      </div>
    </div>
  );
}

export function GridOfActions({
  actions,
  categories,
  states,
  priorities,
}: {
  actions?: Action[];
  categories: Category[];
  states: State[];
  priorities: Priority[];
}) {
  return (
    <div className="scrollbars scrollbars-thin">
      <div className="grid h-full grid-cols-3 place-content-start gap-1">
        {actions?.map((action, index) => (
          <ActionGrid
            action={action}
            key={action.id}
            classNames={
              index === 0 ? "rounded-tl-xl" : index === 2 ? "rounded-tr-xl" : ""
            }
          />
        ))}
      </div>
    </div>
  );
}

function ShortcutActions({ action }: { action: Action }) {
  const navigate = useNavigate();
  const submit = useSubmit();

  function handleActions(data: {
    [key: string]: string | number | null | string[];
  }) {
    submit(
      { ...data },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  }

  useEffect(() => {
    const keyDown = async function (event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const code = event.code;

      // Set States
      if (
        ["i", "f", "z", "a", "t", "c"].find((k) => k === key) &&
        !event.shiftKey
      ) {
        let state_id = STATES.do;
        switch (key) {
          case "i":
            state_id = STATES.ideia;
            break;
          case "f":
            state_id = STATES.do;
            break;
          case "z":
            state_id = STATES.doing;
            break;
          case "a":
            state_id = STATES.review;
            break;
          case "t":
            state_id = STATES.done;
            break;
          case "c":
            state_id = STATES.finish;
            break;
        }

        handleActions({
          intent: INTENTS.updateAction,
          ...action,
          state_id,
        });
      } else if (
        [
          "KeyT",
          "KeyP",
          "KeyV",

          "KeyS",
          "KeyC",
          "KeyI",

          "KeyR",
          "KeyF",
          "KeyD",

          "KeyA",
          "KeyM",
          "KeyN",
        ].find((k) => k === code) &&
        event.altKey
      ) {
        let category_id = CATEGORIES.post;
        switch (code) {
          case "KeyT":
            category_id = CATEGORIES.todo;
            break;

          case "KeyP":
            category_id = CATEGORIES.post;
            break;

          case "KeyV":
            category_id = CATEGORIES.video;
            break;

          case "KeyS":
            category_id = CATEGORIES.stories;
            break;

          case "KeyC":
            category_id = CATEGORIES.dev;
            break;

          case "KeyI":
            category_id = CATEGORIES.print;
            break;

          case "KeyR":
            category_id = CATEGORIES.meeting;
            break;

          case "KeyF":
            category_id = CATEGORIES.finance;
            break;

          case "KeyD":
            category_id = CATEGORIES.design;
            break;

          case "KeyA":
            category_id = CATEGORIES.ads;
            break;
          case "KeyM":
            category_id = CATEGORIES.sm;
            break;

          case "KeyN":
            category_id = CATEGORIES.plan;
            break;
        }

        handleActions({
          intent: INTENTS.updateAction,
          ...action,
          category_id,
        });
      } else if (key === "e" && event.shiftKey) {
        navigate(`/dashboard/action/${action.id}`);
      } else if (key === "d" && event.shiftKey) {
        handleActions({
          ...action,
          newId: window.crypto.randomUUID(),
          created_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          intent: INTENTS.duplicateAction,
        });
      } else if (key === "x" && event.shiftKey) {
        if (confirm("Deseja mesmo excluir essa ação?")) {
          handleActions({
            ...action,
            intent: INTENTS.deleteAction,
          });
        }
      } else if (key === ",") {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          priority_id: PRIORITIES.low,
        });
      } else if (key === ".") {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          priority_id: PRIORITIES.medium,
        });
      } else if (key === "/") {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          priority_id: PRIORITIES.high,
        });
      }
      //em uma hora
      else if (code === "Digit1" && event.shiftKey) {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          date: format(
            isBefore(action.date, new Date())
              ? addHours(new Date(), 1)
              : addHours(action.date, 1),
            "yyyy-MM-dd HH:mm:ss",
          ),
        });
      }
      //em duas horas
      else if (code === "Digit2" && event.shiftKey) {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          date: format(
            isBefore(action.date, new Date())
              ? addHours(new Date(), 2)
              : addHours(action.date, 2),
            "yyyy-MM-dd HH:mm:ss",
          ),
        });
      }
      //em três horas
      else if (code === "Digit3" && event.shiftKey) {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          date: format(
            isBefore(action.date, new Date())
              ? addHours(new Date(), 3)
              : addHours(action.date, 3),
            "yyyy-MM-dd HH:mm:ss",
          ),
        });
      }
      //Hoje
      else if (key === "h" && event.shiftKey) {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          date: format(addMinutes(new Date(), 30), "yyyy-MM-dd HH:mm:ss"),
        });
      }
      // Amanhã
      else if (key === "a" && event.shiftKey) {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          date: format(addDays(new Date(), 1), "yyyy-MM-dd HH:mm:ss"),
        });
      }

      // Adiciona uma semana
      else if (key === "s" && event.shiftKey) {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          date: format(
            isBefore(action.date, new Date())
              ? addWeeks(new Date(), 1)
              : addWeeks(action.date, 1),
            "yyyy-MM-dd HH:mm:ss",
          ),
        });
      }
      // Adiciona um mês
      else if (key === "m" && event.shiftKey) {
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          date: format(
            isBefore(action.date, new Date())
              ? addMonths(new Date(), 1)
              : addMonths(action.date, 1),
            "yyyy-MM-dd HH:mm:ss",
          ),
        });
      }
    };
    window.addEventListener("keydown", keyDown);

    return () => window.removeEventListener("keydown", keyDown);
  }, [action, navigate]);

  return <></>;
}

export function formatActionDatetime({
  date,
  dateFormat,
  timeFormat,
}: {
  date: Date | string;
  dateFormat?: 0 | 1 | 2 | 3 | 4;
  timeFormat?: 0 | 1;
}) {
  // 0 - Sem informação de data
  // 1 - Distância
  // 2 - Curta
  // 3 - Média
  // 4 - Longa

  // 0 - Sem informação de horas
  // 1 - Com horas

  date = typeof date === "string" ? parseISO(date) : date;
  const formatString = (
    dateFormat === 2
      ? `d/M${
          !isSameYear(date.getFullYear(), new Date().getUTCFullYear())
            ? "/yy"
            : ""
        }`
      : dateFormat === 3
        ? `d 'de' MMM${
            !isSameYear(date.getFullYear(), new Date().getUTCFullYear())
              ? " 'de' yy"
              : ""
          }`
        : dateFormat === 4
          ? `E, d 'de' MMMM${
              !isSameYear(date.getFullYear(), new Date().getUTCFullYear())
                ? " 'de' yyy"
                : ""
            }`
          : ""
  ).concat(
    timeFormat
      ? `${dateFormat ? " 'às' " : ""}H'h'${date.getMinutes() > 0 ? "m" : ""}`
      : "",
  );

  return dateFormat === 1
    ? formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
    : format(date, formatString, { locale: ptBR });
}

function ContextMenuItems({
  action,
  handleActions,
}: {
  action: Action;
  handleActions: (data: {
    [key: string]: string | number | null | string[];
  }) => void;
}) {
  const matches = useMatches();
  const { people, states, categories, priorities } = matches[1]
    .data as DashboardDataType;
  const [delay, setDelay] = useState({ hour: 0, day: 0, week: 0 });

  return (
    <ContextMenuContent className="bg-content">
      <ContextMenuItem asChild>
        <Link
          className="bg-item flex items-center gap-2"
          to={`/dashboard/action/${action.id}`}
        >
          <PencilLineIcon className="size-3 opacity-50" />
          <span>Editar</span>
          <ContextMenuShortcut className="pl-2">⇧+E</ContextMenuShortcut>
        </Link>
      </ContextMenuItem>
      <ContextMenuItem className="bg-item flex items-center gap-2">
        <CopyIcon className="size-3 opacity-50" />
        <span>Duplicar</span>
        <ContextMenuShortcut className="pl-2">⇧+D</ContextMenuShortcut>
      </ContextMenuItem>
      {/* Adiar */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item flex items-center gap-2">
          <TimerIcon className="size-3 opacity-50" />
          <span>Adiar</span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="bg-content font-medium">
            {/* Adiar horas */}
            <ContextMenuItem
              asChild
              onSelect={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <div className="flex justify-between">
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  disabled={delay.hour === 0}
                  onClick={() => {
                    setDelay((d) => ({
                      ...d,
                      hour: d.hour > 0 ? d.hour - 1 : d.hour,
                    }));
                  }}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <div className="inline-block w-20 text-center">
                  {`${delay.hour} ${delay.hour === 1 ? "hora" : "horas"}`}
                </div>
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  disabled={delay.hour === 23}
                  onClick={() => {
                    setDelay((d) => ({
                      ...d,
                      hour: d.hour + 1,
                    }));
                  }}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-border" />
            {/* Adiar Dias */}
            <ContextMenuItem
              asChild
              onSelect={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <div className="flex justify-between">
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  disabled={delay.day === 0}
                  onClick={() => {
                    setDelay((d) => ({
                      ...d,
                      day: d.day - 1,
                    }));
                  }}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <div className="inline-block w-20 text-center">
                  {`${delay.day} ${delay.day === 1 ? "dia" : "dias"}`}
                </div>
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  disabled={delay.day === 6}
                  onClick={() => {
                    setDelay((d) => ({
                      ...d,
                      day: d.day + 1,
                    }));
                  }}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-border" />
            {/* Adiar semanas */}
            <ContextMenuItem
              asChild
              onSelect={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <div className="flex justify-between">
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  disabled={delay.week === 0}
                  onClick={() => {
                    setDelay((d) => ({
                      ...d,
                      week: d.week - 1,
                    }));
                  }}
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <div className="inline-block w-24 text-center">
                  {`${delay.week} ${delay.week === 1 ? "semana" : "semanas"}`}
                </div>
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  disabled={delay.week === 8}
                  onClick={() => {
                    setDelay((d) => ({
                      ...d,
                      week: d.week + 1,
                    }));
                  }}
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </ContextMenuItem>
            {delay.day + delay.hour + delay.week > 0 && (
              <>
                <ContextMenuSeparator className="bg-border" />
                <ContextMenuItem
                  disabled={delay.day + delay.hour + delay.week === 0}
                  className="justify-center"
                  asChild
                  onSelect={() => {
                    const date = format(
                      addWeeks(
                        addDays(addHours(action.date, delay.hour), delay.day),
                        delay.week,
                      ),
                      "yyyy-MM-dd HH:mm:ss",
                    );
                    handleActions({
                      intent: INTENTS.updateAction,
                      ...action,

                      date,
                    });
                  }}
                >
                  <div className="flex flex-col">
                    <div className="text-[10px] uppercase tracking-wider">
                      Confirmar adiamento para
                    </div>
                    <div className="px-2 text-base">
                      {formatActionDatetime({
                        date: addWeeks(
                          addDays(addHours(action.date, delay.hour), delay.day),
                          delay.week,
                        ),
                        dateFormat: 4,
                        timeFormat: 1,
                      })}
                    </div>
                  </div>
                </ContextMenuItem>
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
      {/* Deletar */}
      <ContextMenuItem className="bg-item flex items-center gap-2">
        <TrashIcon className="size-3 opacity-50" />
        <span>Deletar</span>
        <ContextMenuShortcut className="pl-2">⇧+X</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator className="bg-border " />
      {/* States */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item flex items-center gap-2">
          <div
            className={`size-2 rounded-full text-muted bg-${
              states.find((state) => state.id === action.state_id)?.slug
            }`}
          ></div>
          <span>
            {states.find((state) => state.id === action.state_id)?.title}
          </span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="bg-content">
            {states.map((state) => (
              <ContextMenuItem
                key={state.id}
                className="bg-item flex items-center gap-2"
                onSelect={() => {
                  handleActions({
                    ...action,
                    state_id: state.id,
                    intent: INTENTS.updateAction,
                  });
                }}
              >
                <div
                  className={`size-2 rounded-full text-muted bg-${state?.slug}`}
                ></div>
                <span>{state.title}</span>
                <ContextMenuShortcut className="pl-2">
                  {
                    [
                      { id: STATES.ideia, shortcut: "i" },
                      { id: STATES.do, shortcut: "f" },
                      { id: STATES.doing, shortcut: "z" },
                      { id: STATES.review, shortcut: "a" },
                      { id: STATES.done, shortcut: "t" },
                      { id: STATES.finish, shortcut: "c" },
                    ].find((s) => s.id === state.id)?.shortcut
                  }
                </ContextMenuShortcut>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>

      {/* Categoria */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item flex items-center gap-2">
          <Icons
            id={
              categories.find((category) => category.id === action.category_id)
                ?.slug
            }
            className="size-3 opacity-50"
          />
          <span>
            {
              categories.find((category) => category.id === action.category_id)
                ?.title
            }
          </span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="bg-content">
            {categories.map((category) => (
              <ContextMenuItem
                key={category.id}
                className="bg-item flex items-center gap-2"
                onSelect={() => {
                  handleActions({
                    ...action,
                    category_id: category.id,
                    intent: INTENTS.updateAction,
                  });
                }}
              >
                <Icons id={category.slug} className="size-3 opacity-50" />
                {category.title}
                <ContextMenuShortcut className="w-8 pl-2 text-left">
                  ⇧+
                  {
                    [
                      { id: CATEGORIES.ads, shortcut: "a" },
                      { id: CATEGORIES.design, shortcut: "d" },
                      { id: CATEGORIES.dev, shortcut: "c" },
                      { id: CATEGORIES.finance, shortcut: "f" },
                      { id: CATEGORIES.meeting, shortcut: "r" },
                      { id: CATEGORIES.plan, shortcut: "n" },
                      { id: CATEGORIES.post, shortcut: "p" },
                      { id: CATEGORIES.print, shortcut: "i" },
                      { id: CATEGORIES.sm, shortcut: "m" },
                      { id: CATEGORIES.stories, shortcut: "s" },
                      { id: CATEGORIES.todo, shortcut: "t" },
                      { id: CATEGORIES.video, shortcut: "v" },
                    ].find((s) => s.id === category.id)?.shortcut
                  }
                </ContextMenuShortcut>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
      {/* Responsibles - Responsáveis  */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item">
          <div className="flex items-center">
            {getResponsibles(people, action.responsibles).map((person) => (
              <Avatar
                item={{
                  image: person.image,
                  short: person.initials!,
                }}
                size="sm"
                key={person.id}
                group
              />
            ))}
          </div>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="bg-content">
            {people.map((person) => (
              <ContextMenuCheckboxItem
                checked={
                  action.responsibles?.find(
                    (user_id) => user_id === person.user_id,
                  )
                    ? true
                    : false
                }
                key={person.id}
                className="bg-select-item flex items-center gap-2"
                onCheckedChange={(e) => {
                  let r = action.responsibles || [person.id];
                  flushSync(() => {
                    if (e) {
                      r = action.responsibles
                        ? [...action.responsibles, person.user_id]
                        : [person.user_id];
                    } else {
                      r = action.responsibles
                        ? action.responsibles.filter(
                            (user_id) => user_id !== person.user_id,
                          )
                        : [person.user_id];
                    }
                  });

                  handleActions({
                    ...action,
                    responsibles: r.join(","),

                    intent: INTENTS.updateAction,
                  });
                }}
              >
                <Avatar
                  item={{
                    image: person.image,
                    short: person.initials!,
                  }}
                  size="sm"
                />
                {`${person.name} ${person.surname}`}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
      {/* Prioridade */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item flex items-center gap-2">
          <Icons
            id={
              priorities.find((priority) => priority.id === action.priority_id)
                ?.slug
            }
            className="size-3 opacity-50"
            type="priority"
          />
          <span>
            {
              priorities.find((priority) => priority.id === action.priority_id)
                ?.title
            }
          </span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="bg-content">
            {priorities.map((priority) => (
              <ContextMenuItem
                key={priority.id}
                className="bg-item flex items-center gap-2"
                onSelect={() => {
                  handleActions({
                    ...action,
                    priority_id: priority.id,
                    intent: INTENTS.updateAction,
                  });
                }}
              >
                <Icons
                  id={priority.slug}
                  type="priority"
                  className="size-3 opacity-50"
                />
                {priority.title}
                <ContextMenuShortcut className="pl-2">
                  {
                    [
                      { id: PRIORITIES.low, shortcut: "," },
                      { id: PRIORITIES.medium, shortcut: "." },
                      { id: PRIORITIES.high, shortcut: "/" },
                    ].find((s) => s.id === priority.id)?.shortcut
                  }
                </ContextMenuShortcut>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
    </ContextMenuContent>
  );
}
