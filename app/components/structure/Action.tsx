import { Link, useMatches, useNavigate, useSubmit } from "@remix-run/react";
import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addWeeks,
  format,
  formatDistanceToNow,
  isBefore,
  isSameYear,
  parseISO,
} from "date-fns";

import { ptBR } from "date-fns/locale";
import {
  ArchiveRestoreIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  ExpandIcon,
  HeartHandshakeIcon,
  PencilLineIcon,
  RabbitIcon,
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
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { INTENTS, PRIORITIES } from "~/lib/constants";
import {
  amIResponsible,
  Avatar,
  AvatarGroup,
  Content,
  getActionsByPriority,
  getActionsByState,
  getActionsByTime,
  getPartners,
  getResponsibles,
  Icons,
  isInstagramFeed,
  isSprint,
  LikeFooter,
} from "~/lib/helpers";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";

export function ActionLine({
  action,
  date,
  onDrag,
  short,
  long,
  allUsers,
  showCategory,
  showDelay,
  showContent,
  showPartner,
}: {
  action: Action;
  date?: { dateFormat?: 0 | 1 | 2 | 3 | 4; timeFormat?: 0 | 1 };
  onDrag?: (action: Action) => void;
  short?: boolean;
  long?: boolean;
  allUsers?: boolean;
  showCategory?: boolean;
  showDelay?: boolean;
  showContent?: boolean;
  showPartner?: boolean;
}) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const matches = useMatches();

  const [edit, setEdit] = useState(false);
  const [isHover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const { states, categories, person, people, priorities, partners, sprints } =
    matches[1].data as DashboardRootType;

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const state = states.find((state) => state.slug === action.state) as State;
  const partner = partners.find(
    (partner) => partner.slug === action.partner,
  ) as Partner;

  const responsibles = getResponsibles(action.responsibles);
  const action_partners = getPartners(action.partners);

  // <div className="grid size-6 place-content-center rounded-full bg-background">
  //                   <HeartHandshakeIcon className="size-4" />
  //                 </div>
  function handleActions(data: {
    [key: string]: string | number | null | string[] | boolean;
  }) {
    submit(
      { ...data, updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss") },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  }

  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ),
    );
  }, [isMobile]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {isInstagramFeed(action.category) && showContent ? (
          <div>
            <div
              title={action.title}
              className={`action relative cursor-pointer rounded outline-none ring-ring ring-offset-2 ring-offset-background focus-within:ring ${
                showDelay &&
                isBefore(action.date, new Date()) &&
                state.slug !== "finished"
                  ? "action-content-delayed rounded"
                  : " "
              }`}
              onClick={() => {
                navigate(`/dashboard/action/${action.id}`);
              }}
              role="button"
              tabIndex={0}
              draggable={!!onDrag && !isMobile}
              onDragEnd={() => {
                if (onDrag) onDrag(action);
              }}
              onMouseEnter={() => {
                setHover(true);
              }}
              onMouseLeave={() => {
                setHover(false);
              }}
            >
              {isHover && !edit ? <ShortcutActions action={action} /> : null}
              <Content
                action={action}
                partner={partner!}
                aspect="squared"
                className={`the-action-content aspect-square overflow-hidden rounded hover:opacity-75`}
              />
              <div className="late-border absolute inset-0 hidden rounded border-2 border-error-600"></div>

              <div className="absolute bottom-1.5 right-2 text-xs font-semibold text-white drop-shadow-sm">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: date?.dateFormat,
                  timeFormat: date?.timeFormat,
                })}
              </div>

              <div className="absolute -top-3 right-2 flex gap-2">
                {isSprint(action.id, sprints) && (
                  <div className="grid size-6 place-content-center rounded border-2 border-background bg-primary text-primary-foreground">
                    <RabbitIcon className="size-4" />
                  </div>
                )}
                {action.partners.length > 1 && (
                  <AvatarGroup
                    avatars={action_partners.map((partner) => ({
                      item: {
                        short: partner.short,
                        bg: partner.colors[0],
                        fg: partner.colors[1],
                      },
                      className: "border-2",
                    }))}
                  />
                )}
                {allUsers && (
                  <AvatarGroup
                    avatars={responsibles.map((responsible) => ({
                      item: {
                        short: responsible.initials,
                        image: responsible.image,
                      },
                      className: "border-2",
                    }))}
                  />
                )}

                {state.slug !== "finished" ? (
                  <div
                    className={`rounded border-2 border-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white`}
                    style={{ backgroundColor: state.color }}
                  >
                    <span>{state.title}</span>
                  </div>
                ) : (
                  <div
                    className="mt-1 grid size-4 place-content-center rounded border-2 border-background text-black"
                    style={{ backgroundColor: state.color }}
                  >
                    <CheckIcon className="size-3" />
                  </div>
                )}
              </div>
            </div>
            <LikeFooter size="sm" liked={state.slug === "finished"} />
          </div>
        ) : (
          <div
            title={action.title}
            className={`action group/action action-item items-center ${long ? "gap-2" : ""} ${short ? "px-2 py-1" : long ? "px-3 py-2" : "p-2"} text-sm font-medium @container md:text-xs ${
              showDelay &&
              isBefore(action.date, new Date()) &&
              state.slug !== "finished"
                ? "action-delayed"
                : ""
            }`}
            style={{ borderLeftColor: state.color }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!edit) {
                navigate(`/dashboard/action/${action.id}`);
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
            draggable={!!onDrag && !isMobile}
            onDragEnd={() => {
              if (onDrag) onDrag(action);
            }}
          >
            {/* Atalhos */}
            {isHover && !edit ? <ShortcutActions action={action} /> : null}

            {partner && showPartner ? (
              <div
                className="mr-2"
                title={getPartners(action.partners)
                  .map((partner) => partner.title)
                  .join(" • ")}
              >
                <AvatarGroup
                  size={long ? "sm" : "xs"}
                  avatars={getPartners(action.partners).map((partner) => ({
                    item: {
                      short: partner.short,
                      bg: partner.colors[0],
                      fg: partner.colors[1],
                    },
                  }))}
                />
                {/* <Avatar
                  size={long ? "sm" : "xs"}
                  item={{
                    short: partner.short,
                    bg: partner.colors[0],
                    fg: partner.colors[1],
                  }}
                /> */}
              </div>
            ) : (
              action.partners.length > 1 && (
                <div
                  className="mr-1"
                  title={getPartners(action.partners)
                    .map((partner) => partner.title)
                    .join(" • ")}
                >
                  <HeartHandshakeIcon className={long ? "size-6" : "size-4"} />
                </div>
              )
            )}

            {showCategory && (
              <div className="mr-1">
                <Icons
                  id={
                    categories.find(
                      (category) => category.slug === action.category,
                    )?.slug
                  }
                  className={`hidden shrink-0 opacity-50 @[200px]:block ${long ? "size-4" : "size-3"}`}
                />
              </div>
            )}

            {/* Title */}

            <div
              className={`relative flex w-full shrink overflow-hidden ${long ? "text-base" : ""}`}
            >
              {edit ? (
                <input
                  ref={inputRef}
                  type="text"
                  name="title"
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
                  className={`relative w-full cursor-text select-none items-center overflow-hidden text-ellipsis text-nowrap text-left outline-none`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!edit) {
                      flushSync(() => {
                        setEdit(true);
                      });
                      inputRef.current?.select();
                    }
                  }}
                >
                  {action.title}
                  {/* <div
                    className={`absolute right-0 top-0 rounded-sm bg-gradient-to-l from-secondary via-secondary pl-6 text-muted-foreground opacity-0 ${isShift ? "group-hover/text:opacity-100" : ""}`}
                  >
                    <Edit3Icon className="size-4" />
                  </div> */}
                </button>
              )}
            </div>

            {/* priority */}

            {long ? (
              <Icons
                id={
                  priorities.find(
                    (priority) => priority.slug === action.priority,
                  )?.slug
                }
                className={long ? "size-5" : "size-3"}
                type="priority"
              />
            ) : (
              action.priority === PRIORITIES.high && (
                <Icons
                  id="high"
                  className={`ml-1 text-red-500 ${long ? "size-5" : "size-3"}`}
                />
              )
            )}

            {/* Responsibles */}

            <div
              className={` ${!allUsers || long ? "hidden @[200px]:flex" : "flex"} justify-end ${long && "w-32"}`}
            >
              {allUsers || long
                ? people
                    .filter(
                      (person) =>
                        action.responsibles.filter(
                          (responsible_id) => responsible_id === person.user_id,
                        ).length > 0,
                    )
                    .map((person) => (
                      <Avatar
                        key={person.id}
                        item={{
                          image: person.image,
                          short: person.initials!,
                        }}
                        size={long ? "sm" : "xs"}
                        group
                      />
                    ))
                : amIResponsible(action.responsibles, person.user_id) && (
                    <Avatar
                      item={{
                        image: person.image,
                        short: person.initials!,
                      }}
                      size={long ? "sm" : "xs"}
                    />
                  )}
            </div>

            {long ? (
              <div className="hidden w-72 overflow-x-hidden whitespace-nowrap text-right text-sm opacity-50 @[150px]:block md:text-[10px]">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: 4,
                  timeFormat: 1,
                })}
              </div>
            ) : (
              date && (
                <div className="ml-1 hidden shrink grow-0 whitespace-nowrap text-right text-xs opacity-50 @[130px]:block md:text-[10px]">
                  {formatActionDatetime({
                    date: action.date,
                    dateFormat: date.dateFormat,
                    timeFormat: date.timeFormat,
                  })}
                </div>
              )
            )}

            {isSprint(action.id, sprints) && (
              <div className="absolute -top-1 right-2 size-2 rounded bg-primary"></div>
            )}
          </div>
        )}
      </ContextMenuTrigger>
      <ContextMenuItems action={action} handleActions={handleActions} />
    </ContextMenu>
  );
}

export function ActionBlock({
  action,
  onDrag,
  sprint,
}: {
  action: Action;
  onDrag?: (action: Action) => void;
  sprint?: Boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = useSubmit();
  const [edit, setEdit] = useState(false);
  const [isHover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const matches = useMatches();
  const navigate = useNavigate();

  const { categories, states, partners, sprints } = matches[1]
    .data as DashboardRootType;
  const partner = partners.find(
    (partner) => partner.slug === action.partner,
  ) as Partner;

  const actionPartners = getPartners(action.partners);

  const state = states.find((state) => state.slug === action.state) as State;

  function handleActions(data: {
    [key: string]: string | number | null | string[] | boolean;
  }) {
    submit(
      { ...data, updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss") },
      {
        action: "/handle-actions",
        method: "post",
        navigate: false,
      },
    );
  }

  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ),
    );
  }, [isMobile]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          title={action.title}
          className={`action group/action action-item cursor-pointer flex-col justify-between gap-2 rounded-l-[4px] rounded-r border-l-4 px-4 py-2 text-sm @container`}
          style={{ borderLeftColor: state.color }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!edit) {
              navigate(`/dashboard/action/${action.id}`);
            }
          }}
          onMouseEnter={() => {
            setHover(true);
          }}
          onMouseLeave={() => {
            setHover(false);
          }}
          draggable={!!onDrag && !isMobile}
          onDragEnd={() => {
            if (onDrag) onDrag(action);
          }}
        >
          {isHover && !edit ? <ShortcutActions action={action} /> : null}
          {/* Title */}
          <div className="leading-tighter relative text-lg font-semibold">
            {edit ? (
              <input
                ref={inputRef}
                type="text"
                defaultValue={action.title}
                className={`w-full overflow-hidden bg-transparent outline-none`}
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
            ) : (
              <button
                ref={buttonRef}
                className={`relative flex w-full cursor-text items-center overflow-hidden text-ellipsis text-nowrap text-left outline-none`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!edit) {
                    flushSync(() => {
                      setEdit(true);
                    });
                    inputRef.current?.focus();
                  }
                }}
              >
                {action.title}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 overflow-x-hidden text-muted-foreground">
            <div className="flex items-center gap-2">
              {/* Partners | Clientes  */}
              {/* {partner ? (
                <Avatar
                  item={{
                    short: partner.short,
                    bg: partner.colors[0],
                    fg: partner.colors[1],
                  }}
                />
              ) : null} */}
              <AvatarGroup partners={actionPartners} />
              {/* Category - Categoria */}
              <div>
                <Icons
                  id={
                    categories.find(
                      (category) => category.slug === action.category,
                    )?.slug
                  }
                  className="w-4"
                />
              </div>
              {/* Priority - Prioridade */}
              {action.priority === PRIORITIES.high ? (
                <div>
                  <Icons id={"high"} className="w-4" type="priority" />
                </div>
              ) : null}
              {/* Responsibles -  Responsáveis */}
              <AvatarGroup people={getResponsibles(action.responsibles)} />
            </div>
            <div className="flex items-center justify-end gap-1 overflow-hidden whitespace-nowrap text-right text-sm font-medium text-muted-foreground md:text-xs">
              <span className="@[240px]:hidden">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: 2,
                  timeFormat: 1,
                })}
              </span>
              <span className="hidden @[240px]:block @[360px]:hidden">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: 3,
                  timeFormat: 1,
                })}
              </span>
              <span className="hidden @[360px]:block">
                {formatActionDatetime({
                  date: action.date,
                  dateFormat: 4,
                  timeFormat: 1,
                })}
              </span>
              •<div>{action.time.toString().concat("m")}</div>
            </div>
          </div>
          {isSprint(action.id, sprints) && sprint && (
            <div className="absolute -top-2 right-2 grid size-6 place-content-center gap-1 rounded border-2 border-background bg-primary text-primary-foreground">
              <RabbitIcon className="size-4" />
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuItems action={action} handleActions={handleActions} />
    </ContextMenu>
  );
}

export function ListOfActions({
  actions,
  showCategory,
  showPartner,
  date,
  columns = 1,
  onDrag,
  isFoldable,
  descending = false,
  orderBy = "state",
  short,
  long,
}: {
  actions?: Action[] | null;
  showCategory?: boolean;
  showPartner?: boolean;
  date?: { dateFormat?: 0 | 1 | 2 | 3 | 4; timeFormat?: 0 | 1 };
  columns?: 1 | 2 | 3 | 6;
  onDrag?: (action: Action) => void;
  isFoldable?: boolean;
  descending?: boolean;
  orderBy?: "state" | "priority" | "time";
  short?: boolean;
  long?: boolean;
}) {
  const matches = useMatches();
  const { states } = matches[1].data as DashboardRootType;

  actions = actions
    ? orderBy === "state"
      ? getActionsByState(actions, states, descending)
      : orderBy === "priority"
        ? getActionsByPriority(actions, descending)
        : actions
    : [];

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
                : "grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
        } gap-x-4 gap-y-1 @container`}
      >
        {actions
          ?.slice(0, fold)
          .map((action) => (
            <ActionLine
              short={short}
              long={long}
              key={action.id}
              action={action}
              showCategory={showCategory}
              showPartner={showPartner}
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
  onDrag,
  orderBy = "state",
  descending = false,
  sprint,
}: {
  actions?: Action[] | null;
  max?: 1 | 2;
  onDrag?: (action: Action) => void;
  orderBy?: "state" | "priority" | "time";
  descending?: boolean;
  sprint?: Boolean;
}) {
  const matches = useMatches();
  const { states } = matches[1].data as DashboardRootType;

  actions = actions
    ? orderBy === "state"
      ? getActionsByState(actions, states, descending)
      : orderBy === "priority"
        ? getActionsByPriority(actions, descending)
        : getActionsByTime(actions, descending)
    : [];

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
          <ActionBlock
            onDrag={onDrag}
            action={action}
            key={action.id}
            sprint={sprint}
          />
        ))}
      </div>
    </div>
  );
}

export function GridOfActions({
  actions,
  partner,
}: {
  actions?: Action[];
  partner: Partner;
}) {
  return (
    <div className="scrollbars scrollbars-thin">
      <div className="grid grid-cols-3 gap-[2px] overflow-hidden rounded">
        {actions?.map((action, index) => (
          <Content
            action={action}
            aspect="squared"
            partner={partner}
            key={index}
          />

          // <ActionGrid
          //   action={action}
          //   key={action.id}
          //   classNames={
          //     index === 0 ? "rounded-tl-xl" : index === 2 ? "rounded-tr-xl" : ""
          //   }
          // />
        ))}
      </div>
    </div>
  );
}

function ShortcutActions({ action }: { action: Action }) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const matches = useMatches();

  const { states, categories, priorities, person, sprints } = matches[1]
    .data as DashboardRootType;

  function handleActions(data: {
    [key: string]: string | number | null | string[] | boolean;
  }) {
    submit(
      { ...data, updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss") },
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
      if (states.find((state) => state.shortcut === key) && !event.shiftKey) {
        let state =
          states.find((state) => state.shortcut === key)?.slug || "do";

        handleActions({
          intent: INTENTS.updateAction,
          ...action,
          state,
        });
      } else if (
        categories.find(
          (category) => category.shortcut === code.toLowerCase().substring(3),
        ) &&
        event.altKey
      ) {
        let category =
          categories.find(
            (category) => category.shortcut === code.toLowerCase().substring(3),
          )?.slug || "post";

        handleActions({
          intent: INTENTS.updateAction,
          ...action,
          category,
        });
      } else if (priorities.find((priority) => priority.shortcut === key)) {
        let priority =
          priorities.find((priority) => priority.shortcut === key)?.slug ||
          PRIORITIES.medium;
        handleActions({
          ...action,
          intent: INTENTS.updateAction,
          priority,
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
      } else if (key === "u" && event.shiftKey) {
        handleActions({
          id: window.crypto.randomUUID(),
          action_id: action.id,
          user_id: person.user_id,
          created_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          intent: isSprint(action.id, sprints)
            ? INTENTS.unsetSprint
            : INTENTS.setSprint,
        });
      } else if (key === "x" && event.shiftKey) {
        if (confirm("Deseja mesmo excluir essa ação?")) {
          handleActions({
            ...action,
            intent: INTENTS.deleteAction,
          });
        }
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

export function ContextMenuItems({
  action,
  handleActions,
}: {
  action: Action;
  handleActions: (data: {
    [key: string]: string | number | null | string[] | boolean;
  }) => void;
}) {
  const matches = useMatches();
  const {
    people,
    states,
    categories,
    priorities,
    areas,
    partners,
    person,
    sprints,
  } = matches[1].data as DashboardRootType;
  const [delay, setDelay] = useState({ hour: 0, day: 0, week: 0 });

  const partner = partners.find((p) => p.slug === action.partner)!;
  const state = states.find((state) => state.slug === action.state);

  return (
    <ContextMenuContent className="glass">
      {/* Editar */}
      <ContextMenuItem asChild>
        <Link
          className="bg-item flex items-center gap-2"
          to={`/dashboard/action/${action.id}`}
        >
          <PencilLineIcon className="size-3" />
          <span>Editar</span>
          <ContextMenuShortcut className="pl-2">⇧+E</ContextMenuShortcut>
        </Link>
      </ContextMenuItem>
      {/* Sprint */}
      <ContextMenuItem
        className="bg-item flex items-center gap-2"
        onSelect={() => {
          handleActions({
            id: window.crypto.randomUUID(),
            user_id: person.user_id,
            action_id: action.id,
            created_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            intent: isSprint(action.id, sprints)
              ? INTENTS.unsetSprint
              : INTENTS.setSprint,
          });
        }}
      >
        <RabbitIcon className="size-3" />
        {isSprint(action.id, sprints) ? (
          <span>Retirar do Sprint</span>
        ) : (
          <span>Colocar no Sprint</span>
        )}
        <ContextMenuShortcut className="pl-2">⇧+U</ContextMenuShortcut>
      </ContextMenuItem>
      {/* Duplicar */}
      <ContextMenuItem className="bg-item flex items-center gap-2">
        <CopyIcon className="size-3" />
        <span>Duplicar</span>
        <ContextMenuShortcut className="pl-2">⇧+D</ContextMenuShortcut>
      </ContextMenuItem>
      {/* Adiar */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item flex items-center gap-2">
          <TimerIcon className="size-3" />
          <span>Adiar</span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="glass font-medium">
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
                  {delay.day + delay.hour + delay.week > 0
                    ? "Data atual"
                    : "Confirmar adiamento para"}
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
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
      {/* Deletar */}
      <ContextMenuItem
        className="bg-item flex items-center gap-2"
        onSelect={() => {
          handleActions({
            ...action,
            intent: action.archived
              ? INTENTS.recoverAction
              : INTENTS.deleteAction,
          });
        }}
      >
        {action.archived ? (
          <>
            <ArchiveRestoreIcon className="size-3" />
            <span>Restaurar</span>
          </>
        ) : (
          <>
            <TrashIcon className="size-3" />
            <span>Deletar</span>
          </>
        )}
        <ContextMenuShortcut className="pl-2">⇧+X</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator className="bg-border" />
      {/* Parceiros */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item">
          <div
            className={`flex items-center ${action.partners.length === 1 ? "gap-2" : "-space-x-1"}`}
          >
            {getPartners(action.partners).map((partner) => (
              <Fragment key={partner.id}>
                <Avatar
                  item={{
                    short: partner.short,
                    bg: partner.colors[0],
                    fg: partner.colors[1],
                  }}
                  size="sm"
                  key={partner.id}
                  group
                />
                {action.partners.length === 1 ? partner.title : null}
              </Fragment>
            ))}
          </div>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="glass">
            {partners.map((partner) => (
              <ContextMenuCheckboxItem
                checked={
                  action.partners?.find(
                    (partner_slug) => partner_slug === partner.slug,
                  )
                    ? true
                    : false
                }
                key={partner.id}
                className="bg-select-item flex items-center gap-2"
                onCheckedChange={(e) => {
                  let r = action.partners || [partner.slug];
                  flushSync(() => {
                    if (e) {
                      r = action.partners
                        ? [...action.partners, partner.slug]
                        : [partner.slug];
                    } else {
                      r = action.partners
                        ? action.partners.filter(
                            (partner_slug) => partner_slug !== partner.slug,
                          )
                        : [partner.slug];
                    }
                  });

                  handleActions({
                    ...action,
                    partners: r.join(","),

                    intent: INTENTS.updateAction,
                  });
                }}
              >
                <Avatar
                  item={{
                    bg: partner.colors[0],
                    fg: partner.colors[1],
                    short: partner.short,
                  }}
                  size="sm"
                />
                {partner.title}
              </ContextMenuCheckboxItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
      {/* States */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item flex items-center gap-2">
          <div
            className={`text-muted} size-2 rounded-full`}
            style={{ backgroundColor: state?.color }}
          ></div>
          <span>{state?.title}</span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="glass">
            {states.map((state) => (
              <ContextMenuItem
                key={state.slug}
                className="bg-item flex items-center gap-2"
                onSelect={() => {
                  handleActions({
                    ...action,
                    state: state.slug,
                    intent: INTENTS.updateAction,
                  });
                }}
              >
                <div
                  className={`size-2 rounded-full text-muted`}
                  style={{ backgroundColor: state.color }}
                ></div>
                <span>{state.title}</span>
                <ContextMenuShortcut className="pl-2">
                  {state.shortcut}
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
              categories.find((category) => category.slug === action.category)
                ?.slug
            }
            className="size-3"
          />
          <span>
            {
              categories.find((category) => category.slug === action.category)
                ?.title
            }
          </span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="glass">
            {areas.map((area, i) => (
              <ContextMenuGroup key={area.id}>
                {i > 0 && <ContextMenuSeparator />}
                <h4 className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {area.title}
                </h4>
                {categories.map((category) =>
                  category.area_id === area.id ? (
                    <ContextMenuItem
                      key={category.slug}
                      className="bg-item flex items-center gap-2"
                      onSelect={() => {
                        handleActions({
                          ...action,
                          category: category.slug,
                          intent: INTENTS.updateAction,
                        });
                      }}
                    >
                      <Icons id={category.slug} className="size-3" />
                      {category.title}
                      <ContextMenuShortcut className="flex w-12 pl-2 text-left">
                        ⌥+
                        <div className="w-full text-center">
                          {category.shortcut.toUpperCase()}
                        </div>
                      </ContextMenuShortcut>
                    </ContextMenuItem>
                  ) : null,
                )}
              </ContextMenuGroup>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
      {/* Responsibles - Responsáveis  */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item">
          <div
            className={`flex items-center ${action.responsibles.length === 1 ? "gap-2" : "-space-x-1"}`}
          >
            {getResponsibles(action.responsibles).map((person) => (
              <Fragment key={person.id}>
                <Avatar
                  item={{
                    image: person.image,
                    short: person.initials!,
                  }}
                  size="sm"
                  key={person.id}
                  group
                />
                {action.responsibles.length === 1 ? person.name : null}
              </Fragment>
            ))}
          </div>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="glass">
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
      {/* Color */}
      {isInstagramFeed(action.category) && (
        <ContextMenuSub>
          <ContextMenuSubTrigger className="bg-item">
            <div
              className="h-4 w-full rounded border"
              style={{ backgroundColor: action.color }}
            ></div>
          </ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent className="glass">
              {getPartners(action.partners)[0].colors.map(
                (color, i) =>
                  i !== 1 && (
                    <ContextMenuItem
                      key={i}
                      className="bg-item flex items-center gap-2"
                      onSelect={() => {
                        handleActions({
                          ...action,
                          color: color,
                          intent: INTENTS.updateAction,
                        });
                      }}
                    >
                      <div
                        style={{ backgroundColor: color }}
                        className="h-4 w-full rounded border"
                      ></div>
                    </ContextMenuItem>
                  ),
              )}
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
      )}

      {/* Prioridade */}
      <ContextMenuSub>
        <ContextMenuSubTrigger className="bg-item flex items-center gap-2">
          <Icons id={action.priority} className="size-3" type="priority" />
          <span>
            {
              priorities.find((priority) => priority.slug === action.priority)
                ?.title
            }
          </span>
        </ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="glass">
            {priorities.map((priority) => (
              <ContextMenuItem
                key={priority.slug}
                className="bg-item flex items-center gap-2"
                onSelect={() => {
                  handleActions({
                    ...action,
                    priority: priority.slug,
                    intent: INTENTS.updateAction,
                  });
                }}
              >
                <Icons id={priority.slug} type="priority" className="size-3" />
                {priority.title}
                <ContextMenuShortcut className="pl-2">
                  {priority.shortcut}
                </ContextMenuShortcut>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
    </ContextMenuContent>
  );
}
