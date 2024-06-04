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
  addMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
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
  Grid3x3Icon,
  PlusIcon,
} from "lucide-react";
import React, { act, useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { ActionLine, GridOfActions } from "~/components/structure/Action";
import Progress from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CATEGORIES, INTENTS, PRIORITIES, STATES } from "~/lib/constants";
import {
  Avatar,
  Icons,
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
    .eq("slug", params["partner"] as string)
    .single();

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
    .returns<ActionComplete[]>();

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

  invariant(partner);

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
          className="flex items-center gap-4 "
        >
          <Avatar
            item={{
              short: partner.short,
              bg: partner.bg,
              fg: partner.fg,
            }}
            size="lg"
          />
          <div className="text-2xl font-extrabold tracking-tight text-secondary-foreground">
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
        </Link>
        <div>
          <Button
            size={"sm"}
            variant={showFeed ? "default" : "ghost"}
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
                <div className="flex items-center gap-1 text-xl font-bold ">
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
                  {/* <Toggle onPressedChange={() => setViewLike()}>
              {(() => {
                return (
                  <>
                    <CalendarClockIcon className="size-4" />
                    <AlignJustifyIcon className="size-4" />
                  </>
                )
              })()}
            </Toggle> */}
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
                        variant={
                          categoryFilter.length > 0 ? "default" : "ghost"
                        }
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
                className={`hidden grid-cols-7 px-0 pb-2 text-center text-xs font-extrabold uppercase tracking-wider  md:grid`}
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
                          ? "text-secondary-foreground"
                          : ""
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
                  <>
                    <CalendarDay
                      key={i}
                      currentDate={currentDate}
                      day={day}
                      setDraggedAction={setDraggedAction}
                      partner={partner}
                      person={person}
                      people={people}
                    />
                    {(i + 1) % 7 === 0 && (
                      <div className="col-span-7 h-[1px] bg-border"></div>
                    )}
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Instagram Grid */}
        {showFeed && (
          <div className="max-w-96">
            <GridOfActions
              categories={categories}
              priorities={priorities}
              states={states}
              actions={instagramActions}
            />
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
}: {
  day: { date: Date; actions?: Action[] };
  currentDate: Date;
  partner: Partner;
  person: Person;
  people: Person[];
  setDraggedAction: React.Dispatch<React.SetStateAction<Action | undefined>>;
}) => {
  const [isHover, setIsHover] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const submit = useSubmit();
  const matches = useMatches();
  const { categories } = matches[1].data as DashboardDataType;
  const { partner } = matches[3].data as DashboardPartnerType;

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

  const newAction = {
    category_id: CATEGORIES.post,
    partner_id: partner.id,
    date: format(
      (() => {
        const date = day.date;
        date.setHours(11, 0);
        return date;
      })(),
      "yyyy-MM-dd HH:mm:ss",
    ),
    title: "",
    description: "",
    priority_id: PRIORITIES.medium,
    responsibles: [person.user_id],
    user_id: person.user_id,
    state_id: STATES.ideia,
  };

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
      onFocus={() => setIsHover(true)}
      onBlur={() => setIsHover(false)}
      onMouseOver={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {/* Brilho */}
      {/* <div className="absolute -top-[1px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-muted opacity-0 transition group-hover/day:opacity-100"></div> */}

      <div className="my-1 flex justify-between">
        <div
          className={`grid h-6 w-6 place-content-center rounded-full text-xs font-medium ${
            isSameMonth(day.date, currentDate) ? "" : "text-muted"
          } ${
            isToday(day.date) ? "bg-primary text-primary-foreground" : "-ml-1"
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
      </div>
      {isHover || isCreating ? (
        <div
          className={`-top-1 right-0 mt-2 ${isCreating ? "relative" : "absolute"}`}
        >
          {isCreating ? (
            <div className="action-item border-idea  p-2">
              <Form
                method="post"
                className="flex items-center gap-2"
                action="/handle-actions"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const formData = new FormData(e.currentTarget);
                  const title = formData.get("title") as string;

                  if (title.length > 2) {
                    handleActions({
                      ...newAction,
                      title,

                      id: window.crypto.randomUUID(),
                      intent: INTENTS.createAction,
                    });
                  }
                }}
              >
                <input
                  type="text"
                  id="title"
                  className="block w-full bg-transparent p-0 text-xs font-medium outline-none placeholder:text-muted"
                  placeholder="+"
                  name="title"
                  autoFocus
                  tabIndex={0}
                  onFocus={() => {
                    setIsCreating(true);
                  }}
                  onBlur={(e) => {
                    setIsCreating(false);
                    if (e.target.value.length > 2)
                      handleActions({
                        ...newAction,
                        title: e.currentTarget.value,
                        id: window.crypto.randomUUID(),
                        intent: INTENTS.createAction,
                      });
                  }}
                />
              </Form>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="grid size-6 place-content-center rounded-full bg-secondary hover:bg-accent"
            >
              <PlusIcon className="size-3" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
