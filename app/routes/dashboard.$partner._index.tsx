/* eslint-disable jsx-a11y/label-has-associated-control */
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useMatches,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { MetaFunction, json, type LoaderFunctionArgs } from "@vercel/remix";
import {
  addHours,
  addMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  ClipboardCheckIcon,
  Grid3x3Icon,
  PlusIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { flushSync } from "react-dom";
import invariant from "tiny-invariant";
import {
  ActionLine,
  ContextMenuItems,
  GridOfActions,
  formatActionDatetime,
} from "~/components/structure/Action";
import Badge from "~/components/structure/Badge";
import Progress from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { ContextMenu, ContextMenuTrigger } from "~/components/ui/context-menu";
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
import { Toggle } from "~/components/ui/toggle";
import { CATEGORIES, INTENTS, PRIORITIES, STATES } from "~/lib/constants";
import {
  Avatar,
  Icons,
  getActionNewDate,
  getCleanAction,
  getDelayedActions,
  getInstagramActions,
  sortActions,
  useIDsToRemove,
  usePendingActions,
} from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  let date = new URL(request.url).searchParams.get("date");

  date ||= format(new Date(), "yyyy-MM-dd");

  const { headers, supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("slug", params["partner"] as "")
    .single();

  invariant(partner);

  const { data: actions } = await supabase
    .from("get_full_actions")
    .select("*")
    .match({ slug: params["partner"] })
    .contains("responsibles", person?.admin ? [] : [user.id])
    .gte(
      "date",
      format(
        startOfDay(startOfWeek(startOfMonth(date))),
        "yyyy-MM-dd HH:mm:ss",
      ),
    )
    .lte(
      "date",
      format(endOfDay(endOfWeek(endOfMonth(date))), "yyyy-MM-dd HH:mm:ss"),
    )
    .returns<Action[]>();

  return json({ actions, partner, person }, { headers });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data?.partner?.title,
    },
  ];
};

export default function Partner() {
  let { actions, partner } = useLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();

  const matches = useMatches();
  const submit = useSubmit();

  const [draggedAction, setDraggedAction] = useState<Action>();
  const [stateFilter, setStateFilter] = useState<State>();
  const [categoryFilter, setCategoryFilter] = useState<Category[]>([]);
  const [showFeed, setFeed] = useState(false);
  const [short, setShort] = useState(false);
  const [allUsers, setAllUsers] = useState(false);

  const { categories, priorities, states, person, people } = matches[1]
    .data as DashboardDataType;

  const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const currentDate = parseISO(date);

  const actionsMap = new Map<string, Action>(
    actions?.map((action) => [action.id, action]),
  );

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const pendingActions = usePendingActions();
  const idsToRemove = useIDsToRemove();

  for (const action of pendingActions as Action[]) {
    if (action.partner_id === partner.id) actionsMap.set(action.id, action);
  }

  for (const id of idsToRemove) {
    actionsMap.delete(id);
  }

  actions = sortActions(Array.from(actionsMap, ([, v]) => v));
  const instagramActions = getInstagramActions({ actions });
  const lateActions = getDelayedActions({ actions });

  const calendar = days.map((day) => {
    return {
      date: day,
      actions: actions?.filter(
        (action) =>
          isSameDay(parseISO(action.date), day) &&
          (categoryFilter.length > 0
            ? categoryFilter.find(
                (category) => category.id === action.category_id,
              )
            : true) &&
          (stateFilter ? action.state_id === stateFilter?.id : true),
      ),
    };
  });

  useEffect(() => {
    if (draggedAction) {
      const day = document.querySelector(".dragover") as HTMLElement;
      const date = day?.getAttribute("data-date") as string;

      if (date !== format(draggedAction.date, "yyyy-MM-dd")) {
        //

        submit(
          {
            ...draggedAction,
            date: date?.concat(`T${format(draggedAction.date, "HH:mm:ss")}`),
            intent: INTENTS.updateAction,
          },
          {
            action: "/handle-actions",
            method: "POST",
            navigate: false,
            fetcherKey: `action:${draggedAction.id}:update:move:calendar`,
          },
        );
        //reset
        setDraggedAction(undefined);
      }
    }
  }, [draggedAction, submit]);

  return (
    <div className="flex flex-col overflow-hidden p-4 md:px-8">
      <div className="flex items-center justify-between">
        <Link
          to={`/dashboard/${partner.slug}`}
          className="relative flex items-center gap-4"
        >
          <Avatar
            item={{
              short: partner.short,
              bg: partner.bg,
              fg: partner.fg,
            }}
            size="lg"
          />
          <div className="text-3xl font-extrabold tracking-tighter">
            <div>{partner?.title}</div>
            <Progress
              total={actions?.length || 1}
              values={states.map((state) => ({
                id: state.id,
                title: state.title,
                value: actions?.filter((action) => action.state_id === state.id)
                  .length,
                color: `bg-${state.slug}`,
              }))}
            />
          </div>
          <Badge
            title={`${lateActions.length} ${lateActions.length === 1 ? "ação" : "ações"} em atraso.`}
            value={lateActions.length}
            className="-right-8"
            isDynamic
          />
        </Link>
        <div>
          <ReportReview partner={partner} />
          <Button
            size={"sm"}
            variant={showFeed ? "accent" : "ghost"}
            className="inline-flex gap-2"
            onClick={() => setFeed((v) => !v)}
          >
            <Grid3x3Icon className="size-4" /> Mostrar Feed do Instagram
          </Button>
        </div>
      </div>
      <div className="h-full w-full gap-4 overflow-hidden lg:flex">
        {/* Calendar */}
        <div className="h-1/2 w-full lg:h-full lg:overflow-hidden">
          <div className="flex h-full flex-col overflow-hidden">
            <div id="daysheader" className="flex w-full flex-col border-b">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-1 text-xl font-bold">
                  <div className="mr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="capitalize outline-none">
                        {format(currentDate, "MMMM", {
                          locale: ptBR,
                        })}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-content">
                        {eachMonthOfInterval({
                          start: startOfYear(new Date()),
                          end: endOfYear(new Date()),
                        }).map((month) => (
                          <DropdownMenuItem
                            className="bg-item capitalize"
                            key={month.getMonth()}
                            onSelect={() => {}}
                            asChild
                          >
                            <Link
                              prefetch="intent"
                              to={`/dashboard/${partner.slug}/?date=${format(
                                new Date().setMonth(month.getMonth()),
                                "yyyy-MM-'01'",
                              )}`}
                            >
                              {format(month, "MMMM", {
                                locale: ptBR,
                              })}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button size="icon" variant="ghost" asChild>
                    <Link
                      prefetch="intent"
                      to={`/dashboard/${partner?.slug}?date=${format(
                        subMonths(currentDate, 1),
                        "yyyy-MM-dd",
                      )}`}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" asChild>
                    <Link
                      prefetch="intent"
                      to={`/dashboard/${partner?.slug}?date=${format(
                        addMonths(currentDate, 1),
                        "yyyy-MM-dd",
                      )}`}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-2 pr-1">
                  <Button
                    size={"sm"}
                    variant={allUsers ? "accent" : "ghost"}
                    onClick={() => setAllUsers((allUsers) => !allUsers)}
                    title={
                      allUsers
                        ? "Mostrar todos os responsáveis"
                        : "Exibir apenas 'eu' como responsável"
                    }
                  >
                    {allUsers ? (
                      <UsersIcon className="size-4" />
                    ) : (
                      <UserIcon className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant={short ? "accent" : "ghost"}
                    size={"sm"}
                    onClick={() => setShort((short) => !short)}
                    title={
                      short
                        ? "Aumentar o tamanho da ação"
                        : "Diminuir o tamanho da ação"
                    }
                  >
                    {short ? (
                      <ChevronsUpDownIcon className="size-4" />
                    ) : (
                      <ChevronsDownUpIcon className="size-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size={"sm"}
                        variant={"ghost"}
                        className={`${
                          stateFilter
                            ? `border-${stateFilter?.slug}`
                            : "border-transparent"
                        } border-2 text-xs font-bold`}
                      >
                        {stateFilter ? stateFilter.title : "Filtre pelo Status"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-content">
                      <DropdownMenuCheckboxItem
                        className="bg-select-item flex gap-2"
                        onCheckedChange={() => {
                          setStateFilter(undefined);
                        }}
                      >
                        <div
                          className={`h-3 w-3 rounded-full border-2 border-white`}
                        ></div>
                        <div>Todos os Status</div>
                      </DropdownMenuCheckboxItem>
                      {states.map((state) => (
                        <DropdownMenuCheckboxItem
                          className="bg-select-item flex gap-2"
                          key={state.id}
                          checked={state.id === stateFilter?.id}
                          onCheckedChange={(checked) => {
                            if (!checked && state.id === stateFilter?.id) {
                              setStateFilter(undefined);
                            } else {
                              setStateFilter(state);
                            }
                          }}
                        >
                          <div
                            className={`h-3 w-3 rounded-full border-2 border-${state.slug}`}
                          ></div>
                          <div>{state.title}</div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size={"sm"}
                        variant={categoryFilter.length > 0 ? "accent" : "ghost"}
                        className={`text-xs font-bold`}
                      >
                        {categoryFilter.length > 0 ? (
                          <>
                            <div>
                              {categoryFilter
                                .map((category) => category.title)
                                .join(", ")}
                            </div>
                          </>
                        ) : (
                          "Filtre pela Categoria"
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-content">
                      <DropdownMenuCheckboxItem
                        className="bg-select-item flex gap-2"
                        checked={categoryFilter?.length == 0}
                        onCheckedChange={() => {
                          setCategoryFilter([]);
                        }}
                      >
                        <Icons className="h-3 w-3" id="all" />
                        <div>Todas as Categorias</div>
                      </DropdownMenuCheckboxItem>
                      {categories.map((category) => (
                        <DropdownMenuCheckboxItem
                          className="bg-select-item flex gap-2"
                          key={category.id}
                          checked={
                            categoryFilter
                              ? categoryFilter?.findIndex(
                                  (c) => category.id === c.id,
                                ) >= 0
                              : false
                          }
                          onCheckedChange={(checked) => {
                            if (
                              !checked &&
                              categoryFilter?.findIndex(
                                (c) => category.id === c.id,
                              ) >= 0
                            ) {
                              const filters = categoryFilter.filter(
                                (c) => c.id != category.id,
                              );

                              setCategoryFilter(filters);
                            } else {
                              setCategoryFilter(
                                categoryFilter
                                  ? [...categoryFilter, category]
                                  : [category],
                              );
                            }
                          }}
                        >
                          <Icons id={category.slug} className="h-3 w-3" />
                          <div>{category.title}</div>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div
                className={`hidden grid-cols-7 px-0 pb-2 text-center text-xs font-extrabold uppercase tracking-wider md:grid`}
              >
                {eachDayOfInterval({
                  start: startOfWeek(new Date()),
                  end: endOfWeek(new Date()),
                }).map((day, j) => {
                  return (
                    <div
                      key={j}
                      className={
                        day.getDay() === new Date().getDay()
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      {format(day, "EEE", {
                        locale: ptBR,
                      })}
                    </div>
                  );
                })}
              </div>
              <div
                id="divider"
                className="absolute bottom-0 hidden h-[1px] w-full bg-gradient-to-r from-transparent via-muted"
              ></div>
            </div>
            <div className="scrollbars scrollbars-thin main-container h-full overflow-y-hidden">
              <div id="calendar" className={`grid-cols-7 pb-4 md:grid`}>
                {calendar.map((day, i) => (
                  <CalendarDay
                    currentDate={currentDate}
                    day={day}
                    setDraggedAction={setDraggedAction}
                    person={person}
                    short={short}
                    allUsers={allUsers}
                    key={i}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Instagram Grid */}
        {showFeed && (
          <div className="max-w-96">
            <GridOfActions actions={instagramActions} />
          </div>
        )}
      </div>
    </div>
  );
}

export const CalendarDay = ({
  day,
  currentDate,
  setDraggedAction,
  person,
  short,
  allUsers,
}: {
  day: { date: Date; actions?: Action[] };
  currentDate: Date;
  setDraggedAction: React.Dispatch<React.SetStateAction<Action | undefined>>;
  person: Person;
  short?: boolean;
  allUsers?: boolean;
}) => {
  const [isHover, setIsHover] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const submit = useSubmit();
  const matches = useMatches();
  const { categories, states, people } = matches[1].data as DashboardDataType;
  const { partner } = matches[3].data as DashboardPartnerType;
  const [newAction, setNewAction] = useState(
    getCleanAction({
      responsibles: [person.user_id],
      user_id: person.user_id,
      date: day.date,
      partner_id: partner.id,
    }),
  );

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

  function handleNewAction(data: {
    [key: string]: string | number | null | string[];
  }) {
    if (typeof data["responsibles"] === "string") {
      data["responsibles"] = (data["responsibles"] as string).split(",");
    }

    let filteredData: {
      [key: string]: string | number | null | string[];
    } = {};

    Object.entries(data).map((entry) => {
      if (entry[0] !== "intent") {
        filteredData[entry[0]] = entry[1];
      }
    });

    setNewAction((action) => ({ ...action, ...filteredData }));
  }

  return (
    <div
      className={`${
        !isSameMonth(day.date, currentDate) ? "hidden md:block" : ""
      } item-container relative flex flex-col pb-4 pt-2 transition md:px-1 md:pt-0`}
      data-date={format(day.date, "yyyy-MM-dd")}
      onDragOver={(e) => {
        e.stopPropagation();
        e.preventDefault();
        document
          .querySelectorAll(".dragover")
          .forEach((e) => e.classList.remove("dragover"));
        e.currentTarget.classList.add("dragover");
      }}
      onDragEnd={(e) => {
        setTimeout(() => {
          document
            .querySelectorAll(".dragover")
            .forEach((e) => e.classList.remove("dragover"));
        }, 500);
      }}
      onFocus={() => setIsHover(true)}
      onBlur={() => setIsHover(false)}
      onMouseOver={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div className="my-1 flex justify-between">
        <div
          className={`grid h-6 w-6 place-content-center rounded-full text-xs font-medium ${
            isSameMonth(day.date, currentDate) ? "" : "text-muted"
          } ${
            isToday(day.date) ? "bg-accent text-accent-foreground" : "-ml-1"
          } `}
        >
          {day.date.getDate()}
        </div>
      </div>
      <div className="relative flex flex-col gap-3">
        {categories
          .map((category) => ({
            category,
            actions: day.actions?.filter(
              (action) => category.id === action.category_id,
            ),
          }))
          .map(({ category, actions }) =>
            actions && actions.length > 0 ? (
              <div key={category.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest">
                  <div
                    className={`bg-${category.slug} size-1.5 rounded-full`}
                  ></div>
                  <div>{category.title}</div>
                </div>
                {actions?.map((action) => (
                  <ActionLine
                    short={short}
                    allUsers={allUsers}
                    showDelay
                    action={action}
                    key={action.id}
                    date={{
                      timeFormat: 1,
                    }}
                    onDrag={setDraggedAction}
                  />
                ))}
              </div>
            ) : null,
          )}
        <button
          className={`${isCreating ? "hidden" : isHover ? "rounded-[4px] bg-accent p-1 transition hover:bg-muted" : "opacity-0"}`}
          onClick={() => setIsCreating(true)}
        >
          <PlusIcon className="mx-auto my-1 size-3" />
        </button>
        {isCreating && (
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`action-item action-${states.find((state) => state.id === newAction.state_id)?.slug} flex flex-col bg-accent outline-none ring-offset-2 focus:ring-ring`}
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <input
                    type="text"
                    placeholder="Nova ação"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ fontStretch: "85%" }}
                    value={newAction.title}
                    onChange={(event) =>
                      setNewAction((action) => ({
                        ...action,
                        title: event.target.value,
                      }))
                    }
                    tabIndex={0}
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key.toLowerCase() === "escape") {
                        setIsCreating(false);
                      } else if (
                        event.key.toLowerCase() === "enter" &&
                        event.currentTarget.value.length > 3
                      ) {
                        flushSync(() => {
                          handleActions({
                            intent: INTENTS.createAction,
                            ...newAction,
                            id: window.crypto.randomUUID(),
                          });
                        });

                        if (!event.shiftKey) {
                          setIsCreating(false);
                        }
                        setNewAction(
                          getCleanAction({
                            responsibles: [person.user_id],
                            user_id: person.user_id,
                            date: day.date,
                            partner_id: partner.id,
                          }),
                        );
                      }
                    }}
                  />
                  <button
                    onClick={() => setIsCreating(false)}
                    className="h-4 rounded-[4px] text-muted-foreground outline-none ring-ring focus:text-secondary-foreground focus:ring-2"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 px-2 py-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icons
                      id={
                        categories.find(
                          (category) => category.id === newAction.category_id,
                        )?.slug
                      }
                      className="size-3"
                    />
                    <div className="flex">
                      {people
                        .filter((person) =>
                          newAction.responsibles.find(
                            (responsible) => person.user_id === responsible,
                          ),
                        )
                        .map((responsible) => (
                          <Avatar
                            className="-ml-1"
                            key={responsible.id}
                            size="xs"
                            item={{
                              image: responsible.image,
                              short: responsible.initials!,
                            }}
                          />
                        ))}
                    </div>
                  </div>
                  <div className="overflow-hidden whitespace-nowrap text-[10px]">
                    {formatActionDatetime({
                      date: newAction.date,
                      dateFormat: 2,
                      timeFormat: 1,
                    })}
                  </div>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuItems
              action={newAction as Action}
              handleActions={handleNewAction}
            />
          </ContextMenu>
        )}
      </div>
    </div>
  );
};

export const ReportReview = ({ partner }: { partner: Partner }) => {
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfDay(startOfWeek(new Date())),
    to: endOfDay(endOfWeek(new Date())),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"ghost"} size={"sm"}>
          <ClipboardCheckIcon className="mr-2 size-4" />
          Gerar Relatório
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-content">
        <Calendar
          mode="range"
          selected={range}
          locale={ptBR}
          onSelect={(range) => setRange(range)}
        />
        {range?.from && range.to ? (
          <>
            <div className="border-b"></div>
            <div className="py-2 text-center text-sm">
              {range.from && range.to
                ? `${format(range.from, "d/M/yy")} a ${format(range.to, "d/M/yy")}`
                : "Selecione um intervalo de datas"}
            </div>
            <div className="text-center">
              <Button asChild>
                <Link
                  to={`/report?range=${format(range.from, "yyyy-MM-dd")}---${format(range.to, "yyyy-MM-dd")}&partner_id=${partner.id}`}
                >
                  Gerar relatório de aprovação
                </Link>
              </Button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};
