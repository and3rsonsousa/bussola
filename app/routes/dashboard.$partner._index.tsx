/* eslint-disable jsx-a11y/label-has-associated-control */
import {
  Link,
  redirect,
  useLoaderData,
  useMatches,
  useOutletContext,
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
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { format } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import {
  AlignJustifyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  Grid3x3Icon,
  HomeIcon,
  ImageIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { ActionLine, GridOfActions } from "~/components/structure/Action";
import CreateAction from "~/components/structure/CreateAction";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { INTENTS } from "~/lib/constants";
import {
  Icons,
  getCategoriesSortedByContent,
  getInstagramFeed,
  isInstagramFeed,
  sortActions,
  useIDsToRemove,
  usePendingData,
} from "~/lib/helpers";
import { createClient } from "~/lib/supabase";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SiInsta360,
  SiInstagram,
  SiInstagramHex,
} from "@icons-pack/react-simple-icons";

export const config = { runtime: "edge" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  let _date = new URL(request.url).searchParams.get("date");

  let date = _date
    ? _date.split("-").length === 2
      ? _date.concat("-15")
      : _date
    : format(new Date(), "yyyy-MM-dd");

  date = date?.replace(/\-01$/, "-02");

  let start = startOfWeek(startOfMonth(date));
  let end = endOfDay(endOfWeek(endOfMonth(date)));

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

  const [{ data: actions }, { data: actionsChart }, { data: partner }] =
    await Promise.all([
      supabase
        .from("actions")
        .select("*")
        .is("archived", false)
        // .eq("partner", params["partner"]!)
        .contains("responsibles", person?.admin ? [] : [user.id])
        .contains("partners", [params["partner"]!])
        .gte("date", format(start, "yyyy-MM-dd HH:mm:ss"))
        .lte("date", format(end, "yyyy-MM-dd HH:mm:ss"))
        .returns<Action[]>(),
      supabase
        .from("actions")

        .select("category, date, state")
        .is("archived", false)
        .eq("partner", params["partner"]!)
        .contains("responsibles", person?.admin ? [] : [user.id]),
      supabase
        .from("partners")
        .select()
        .eq("slug", params["partner"]!)
        .single(),
    ]);

  invariant(partner);

  return json({ actions, actionsChart, partner, person, date }, { headers });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data?.partner?.title,
    },
  ];
};

export default function Partner() {
  let { actions, partner, date } = useLoaderData<typeof loader>();

  const matches = useMatches();
  const submit = useSubmit();

  const [short, setShort] = useState(false);
  const [allUsers, setAllUsers] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [params] = useSearchParams();
  const {
    showFeed,
    setShowFeed,
    categoryFilter,
    setCategoryFilter,
    stateFilter,
    setStateFilter,
  } = useOutletContext() as ContextType;

  const { categories, states, person, celebrations } = matches[1]
    .data as DashboardRootType;

  const [isInstagramDate, setInstagramDate] = useState(false);

  const currentDate = date;
  const pendingActions = usePendingData().actions;
  const deletingIDsActions = useIDsToRemove().actions;

  // Calcs

  const actionsMap = new Map<string, Action>(
    actions?.map((action) => [action.id, action]),
  );

  for (const action of pendingActions) {
    if (action.partners[0] === partner.slug) actionsMap.set(action.id, action);
  }

  for (const id of deletingIDsActions) {
    actionsMap.delete(id);
  }

  actions = sortActions(Array.from(actionsMap, ([, v]) => v));
  const instagramActions = getInstagramFeed({ actions });

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const calendar = days.map((day) => {
    return {
      date: format(day, "yyyy-MM-dd"),
      actions: actions?.filter(
        (action) =>
          isSameDay(
            isInstagramDate
              ? parseISO(action.instagram_date)
              : parseISO(action.date),
            day,
          ) &&
          (categoryFilter.length > 0
            ? categoryFilter.find(
                (category) => category.slug === action.category,
              )
            : true) &&
          (stateFilter ? action.state === stateFilter?.slug : true),
      ),
      celebrations: celebrations.filter((celebration) =>
        isSameDay(day, parseISO(celebration.date)),
      ),
    };
  });

  useEffect(() => {
    // Scroll into the day
    let date = params.get("date");
    date = date
      ? date.split("-").length === 3
        ? date
        : date.concat("-01")
      : format(new Date(), "yyyy-MM-dd");
    const day = document.querySelector<HTMLDivElement>(`#day_${date}`)!;
    const calendar = document.querySelector<HTMLDivElement>(`#calendar`)!;
    const calendarFull =
      document.querySelector<HTMLDivElement>(`#calendar-full`)!;

    calendarFull.scrollTo({ left: day.offsetLeft - 48, behavior: "smooth" });
    calendar.scrollTo({ top: day.offsetTop - 96, behavior: "smooth" });

    function keyDown(event: KeyboardEvent) {
      if (event.shiftKey && event.altKey) {
        event.preventDefault();
        event.stopPropagation();

        const code = event.code;

        if (code === "KeyC") {
          setShowContent((value) => !value);
        } else if (code === "KeyR") {
          setAllUsers((value) => !value);
        } else if (code === "KeyS") {
          setShort((value) => !value);
        } else if (code === "KeyI") {
          setShowFeed((value) => !value);
        }
      }
    }

    document.addEventListener("keydown", keyDown);

    return () => document.removeEventListener("keydown", keyDown);
  }, []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const date = over?.id as string;
    const actionDate = isInstagramDate
      ? (active.data.current?.instagram_date as string)
      : (active.data.current?.date as string);
    const draggedAction = actions?.find((action) => action.id === active.id)!;

    if (date !== format(actionDate, "yyyy-MM-dd")) {
      submit(
        {
          ...draggedAction,
          [isInstagramDate ? "instagram_date" : "date"]: date?.concat(
            ` ${format(actionDate, "HH:mm:ss")}`,
          ),
          intent: INTENTS.updateAction,
        },
        {
          action: "/handle-actions",
          method: "POST",
          navigate: false,
          fetcherKey: `action:${active.id}:update:move:calendar`,
        },
      );
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Header */}

      <div className="flex h-full w-full overflow-hidden overflow-x-auto">
        {/* Calendar */}
        <div
          className={`flex h-full w-full min-w-[90vw] flex-col overflow-hidden lg:min-w-[800px]`}
        >
          <div className="items-center justify-between px-4 py-2 md:flex md:px-8">
            <div className="flex items-center gap-1">
              <Link to="/dashboard" viewTransition>
                <HomeIcon />
              </Link>
              <div className="mr-1">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="capitalize outline-hidden"
                    asChild
                  >
                    <Button variant={"ghost"} className="text-xl font-bold">
                      {format(currentDate, "MMMM", {
                        locale: ptBR,
                      })}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass">
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
            <div className="flex items-center gap-1 pr-1 lg:gap-2">
              <Button
                size={"sm"}
                variant={isInstagramDate ? "default" : "ghost"}
                onClick={() => {
                  if (isInstagramDate) {
                    setInstagramDate(false);
                    setShowContent(false);
                  } else {
                    setInstagramDate(true);
                    setShowContent(true);
                  }
                }}
                title={"Organizar ações pelas datas do Instagram"}
              >
                <SiInstagram className="size4" />
              </Button>
              <Button
                size={"sm"}
                variant={showContent ? "default" : "ghost"}
                onClick={() => setShowContent((showContent) => !showContent)}
                title={
                  showContent
                    ? "Mostrar conteúdo das postagens"
                    : "Mostrar apenas os títulos"
                }
              >
                {showContent ? (
                  <ImageIcon className="size-4" />
                ) : (
                  <AlignJustifyIcon className="size-4" />
                )}
              </Button>
              <Button
                size={"sm"}
                variant={allUsers ? "default" : "ghost"}
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
                variant={short ? "default" : "ghost"}
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
                    className={`border-2 text-xs font-bold`}
                    style={{
                      borderColor: stateFilter
                        ? stateFilter.color
                        : "transparent",
                    }}
                  >
                    {stateFilter ? (
                      stateFilter.title
                    ) : (
                      <>
                        <span className="-mr-1 hidden font-normal md:inline">
                          Filtrar pelo
                        </span>
                        Status
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass">
                  <DropdownMenuItem
                    className="bg-item"
                    onSelect={() => {
                      setStateFilter(undefined);
                    }}
                  >
                    <div className={`size-2 rounded-full bg-gray-500`}></div>
                    <div>Todos os Status</div>
                  </DropdownMenuItem>
                  {states.map((state) => (
                    <DropdownMenuItem
                      className="bg-item"
                      key={state.slug}
                      onSelect={() => setStateFilter(state)}
                    >
                      <div
                        className={`h-2 w-2 rounded-full`}
                        style={{ backgroundColor: state.color }}
                      ></div>
                      <div>{state.title}</div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size={"sm"}
                    variant={categoryFilter.length > 0 ? "secondary" : "ghost"}
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
                      <>
                        <span className="-mr-1 hidden font-normal md:inline">
                          Filtrar pela
                        </span>
                        Categoria
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass">
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

                  <DropdownMenuCheckboxItem
                    className="bg-select-item flex gap-2"
                    checked={
                      categoryFilter
                        ? categoryFilter.filter((cf) => isInstagramFeed(cf.id))
                            .length === 3
                        : false
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCategoryFilter(
                          categories.filter((category) =>
                            isInstagramFeed(category.slug),
                          ),
                        );
                      } else {
                        setCategoryFilter([]);
                      }
                    }}
                  >
                    <Grid3x3Icon className="h-3 w-3" />
                    <div>Feed do Instagram</div>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator className="border-t" />
                  {categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      className="bg-select-item flex gap-2"
                      key={category.slug}
                      checked={
                        categoryFilter
                          ? categoryFilter?.findIndex(
                              (c) => category.slug === c.slug,
                            ) >= 0
                          : false
                      }
                      onCheckedChange={(checked) => {
                        if (
                          !checked &&
                          categoryFilter?.findIndex(
                            (c) => category.slug === c.slug,
                          ) >= 0
                        ) {
                          const filters = categoryFilter.filter(
                            (c) => c.slug != category.slug,
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
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <div
              className="scrollbars-horizontal main-container h-full overflow-y-auto px-4 md:px-8"
              id="calendar-full"
            >
              <div
                className={`grid min-w-[1200px] grid-cols-7 border-t border-b px-0 py-2 text-center text-xs font-bold tracking-wider uppercase`}
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
                id="calendar"
                className={`scrollbars scrollbars-thin grid min-w-[1200px] grid-cols-7 pb-32`}
              >
                {calendar.map((day, i) => (
                  <CalendarDay
                    currentDate={currentDate}
                    day={day}
                    person={person}
                    short={short}
                    allUsers={allUsers}
                    showContent={showContent}
                    key={i}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </DndContext>
        </div>
        {/* Instagram Grid */}
        {showFeed && (
          <div
            className="w-full max-w-[600px] min-w-96 py-4 pb-20"
            id="instagram-grid"
          >
            <GridOfActions
              partner={partner}
              actions={instagramActions as Action[]}
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
  short,
  allUsers,
  showContent,
  index,
}: {
  day: { date: string; actions?: Action[]; celebrations?: Celebration[] };
  currentDate: Date | string;
  person: Person;
  short?: boolean;
  allUsers?: boolean;
  showContent?: boolean;
  index?: string | number;
}) => {
  const matches = useMatches();
  const { categories } = matches[1].data as DashboardRootType;

  const { setNodeRef, isOver } = useDroppable({
    id: `${format(parseISO(day.date), "yyyy-MM-dd")}`,
  });

  return (
    <div className="py-2">
      <div
        ref={setNodeRef}
        id={`day_${format(parseISO(day.date), "yyyy-MM-dd")}`}
        className={`item-container group/day relative flex h-full flex-col rounded border-2 border-transparent px-2 pb-4 ${Math.floor(Number(index) / 7) % 2 === 0 ? "item-even" : "item-odd"} ${isOver ? "dragover" : ""}`}
        data-date={format(parseISO(day.date), "yyyy-MM-dd")}
      >
        {/* Date */}
        <div className="mb-2 flex items-center justify-between">
          <div
            className={`grid size-8 place-content-center rounded-full text-xl ${
              isToday(parseISO(day.date))
                ? "bg-primary text-primary-foreground font-medium"
                : `${!isSameMonth(parseISO(day.date), currentDate) ? "text-muted" : ""} -ml-2 font-light`
            }`}
          >
            {parseISO(day.date).getDate()}
          </div>
          <div className="scale-50 opacity-0 group-hover/day:scale-100 group-hover/day:opacity-100 focus-within:scale-100 focus-within:opacity-100">
            <CreateAction mode="day" date={day.date} />
          </div>
        </div>
        {/* Actions and Celebration */}
        <div className="flex h-full flex-col justify-between">
          <div className="relative flex h-full grow flex-col gap-3">
            {showContent
              ? getCategoriesSortedByContent(categories).map((section, i) => (
                  <div key={i} className={i === 0 ? "flex flex-col gap-3" : ""}>
                    {i === 0 &&
                      day.actions?.filter((action) =>
                        isInstagramFeed(action.category),
                      ).length !== 0 && (
                        <div className="mb-2 flex items-center gap-1 text-[12px] font-medium">
                          <Grid3x3Icon className="size-4" />
                          <div>Feed</div>
                        </div>
                      )}
                    {section
                      .map((category) => ({
                        category,
                        actions: day.actions?.filter(
                          (action) => action.category === category.slug,
                        ),
                      }))
                      .map(({ actions, category }) => (
                        <CategoryActions
                          allUsers={allUsers}
                          category={category}
                          actions={actions}
                          short={short}
                          showContent
                          key={category.id}
                        />
                      ))}
                  </div>
                ))
              : categories
                  .map((category) => ({
                    category,
                    actions: day.actions?.filter(
                      (action) => category.slug === action.category,
                    ),
                  }))
                  .map(
                    ({ category, actions }, i) =>
                      actions &&
                      actions.length > 0 && (
                        <CategoryActions
                          allUsers={allUsers}
                          category={category}
                          actions={actions}
                          short={short}
                          key={category.id}
                        />
                      ),
                  )}
          </div>
          {day.celebrations && day.celebrations.length > 0 && (
            <div className="mt-4 space-y-2 text-[10px] opacity-50">
              {day.celebrations?.map((celebration) => (
                <div key={celebration.id} className="leading-none">
                  {celebration.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function CategoryActions({
  category,
  actions,
  showContent,
  short,
  allUsers,
}: {
  category: Category;
  actions?: Action[];
  showContent?: boolean;
  short?: boolean;
  allUsers?: boolean;
}) {
  return actions && actions.length > 0 ? (
    <div key={category.slug} className="flex flex-col gap-3">
      {!(showContent && isInstagramFeed(category.slug)) && (
        <div className="mt-2 flex items-center gap-1 text-[8px] font-bold tracking-widest uppercase">
          <div
            className={`size-1.5 rounded-full`}
            style={{ backgroundColor: category.color }}
          ></div>
          <div>{category.title}</div>
        </div>
      )}
      <div className={`flex flex-col gap-1`}>
        {actions?.map((action) => (
          <ActionLine
            showContent={showContent}
            short={short}
            allUsers={allUsers}
            showDelay
            action={action}
            key={action.id}
            date={{
              timeFormat: 1,
            }}
          />
        ))}
      </div>
    </div>
  ) : null;
}
