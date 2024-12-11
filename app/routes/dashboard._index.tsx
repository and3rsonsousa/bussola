import {
  Link,
  redirect,
  useLoaderData,
  useMatches,
  useOutletContext,
  useSubmit,
} from "@remix-run/react";
import { type LoaderFunctionArgs, type MetaFunction } from "@vercel/remix";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  formatRelative,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarClock,
  ChevronLeftIcon,
  ChevronRightIcon,
  ComponentIcon,
  GridIcon,
  KanbanIcon,
  ListIcon,
  ListTodoIcon,
  RabbitIcon,
  SignalIcon,
  TimerIcon,
} from "lucide-react";
import { useEffect, useState, type SetStateAction } from "react";
import { Pie, PieChart } from "recharts";
import invariant from "tiny-invariant";
import { motion } from "motion/react";

import {
  ActionLine,
  BlockOfActions,
  ListOfActions,
} from "~/components/structure/Action";
import Badge from "~/components/structure/Badge";
import CreateAction from "~/components/structure/CreateAction";
import Kanban from "~/components/structure/Kanban";
import { CircularProgress } from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Toggle } from "~/components/ui/toggle";
import { INTENTS } from "~/lib/constants";
import {
  Avatar,
  Icons,
  getActionsByState,
  getActionsForThisDay,
  getDelayedActions,
  getInstagramFeed,
  sortActions,
  useIDsToRemove,
  usePendingData,
} from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const config = { runtime: "edge" };
// const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { headers, supabase } = createClient(request);

  // const result = await fetch("https://br.storage.bunnycdn.com/agencia-cnvt/", {
  //   method: "GET",
  //   headers: { AccessKey: ACCESS_KEY!, accept: "application/json" },
  // });
  // const folders = await result.json() as [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const [{ data: person }, { data: partners }] = await Promise.all([
    supabase.from("people").select("*").eq("user_id", user.id).single(),
    supabase.from("partners").select("slug").eq("archived", false),
  ]);

  invariant(person);
  invariant(partners);

  let start = startOfWeek(startOfMonth(new Date()));
  let end = endOfDay(endOfWeek(endOfMonth(addMonths(new Date(), 1))));
  const [{ data: actions }, { data: actionsChart }, { data: lateActions }] =
    await Promise.all([
      supabase
        .from("actions")
        .select("*")
        .is("archived", false)
        .contains("responsibles", person.admin ? [] : [user.id])
        .containedBy("partners", partners.map((p) => p.slug)!)
        .gte("date", format(start, "yyyy-MM-dd HH:mm:ss"))
        .lte("date", format(end, "yyyy-MM-dd HH:mm:ss"))
        .returns<Action[]>(),
      supabase
        .from("actions")
        .select("category, state, date")
        .is("archived", false)
        .contains("responsibles", person?.admin ? [] : [user.id])
        .containedBy("partners", partners.map((p) => p.slug)!)
        .returns<{ state: string; date: string }[]>(),
      supabase
        .from("actions")
        .select("*")
        .is("archived", false)
        .neq("state", "finished")
        .contains("responsibles", person.admin ? [] : [user.id])
        .containedBy("partners", partners.map((p) => p.slug)!)
        .gte("date", format(start, "yyyy-MM-dd HH:mm:ss"))
        .lte("date", format(end, "yyyy-MM-dd HH:mm:ss"))
        .returns<Action[]>(),
    ]);

  // return json({ actions, actionsChart }, { headers });
  return { actions, actionsChart };
};

export const meta: MetaFunction = () => {
  return [
    { title: "ʙússoʟa - Domine, Crie e Conquiste." },
    {
      name: "description",
      content:
        "Aplicativo de Gestão de Projetos Criado e Mantido pela Agência Canivete. ",
    },
  ];
};

export default function DashboardIndex() {
  let { actions } = useLoaderData<typeof loader>();
  const matches = useMatches();
  const submit = useSubmit();
  const { setTransitioning } = useOutletContext() as ContextType;
  const [draggedAction, setDraggedAction] = useState<Action>();
  const [todayView, setTodayView] = useState<
    "kanban" | "hours" | "categories" | "feed"
  >("kanban");
  const [currentDay, setCurrentDay] = useState(new Date());

  if (!actions) {
    actions = [];
  }

  const { person, states, partners } = matches[1].data as DashboardRootType;

  const pendingActions = usePendingData().actions;
  const deletingIDsActions = useIDsToRemove().actions;

  //Actions
  // Transform into a Map
  const actionsMap = new Map<string, Action>(
    actions.map((action) => [action.id, action]),
  );
  // Add pending Created/Updated Actions
  for (const action of pendingActions as Action[]) {
    actionsMap.set(action.id, action);
  }
  // Remove pending deleting Actions
  for (const id of deletingIDsActions) {
    actionsMap.delete(id);
  }
  // transform and sort
  actions = sortActions(Array.from(actionsMap, ([, v]) => v));

  const lateActions = getDelayedActions({
    actions: actions as Action[],
  }) as Action[];
  const currentActions = getActionsForThisDay({ actions, date: currentDay });
  const tomorrowActions = getActionsByState(
    getActionsForThisDay({
      actions,
      date: addDays(new Date(), 1),
    }),
    states,
  );

  const weekActions = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  }).map((day) => ({
    date: day,
    actions: actions?.filter((action) =>
      isSameDay(action.date, day),
    ) as Action[],
  }));
  const nextActions = actions?.filter((action) => action.state != "finished");

  useEffect(() => {
    if (draggedAction) {
      const day = document.querySelector(".dragover") as HTMLElement;
      const date = day?.getAttribute("data-date") as string;

      if (date !== format(draggedAction.date, "yyyy-MM-dd")) {
        //
        submit(
          {
            id: draggedAction.id,
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
      }
      //reset
      setDraggedAction(undefined);
    }
  }, [draggedAction, submit]);

  useEffect(() => {
    setTransitioning(false);
  }, []);

  return (
    <div className="scrollbars">
      <div className="px-2 md:px-8">
        <ActionsProgress />
        <Sprint />
        {/* Ações em Atraso */}
        {lateActions?.length ? <DelayedActions actions={lateActions} /> : null}
        {/* Parceiros */}
        <Partners actions={actions as Action[]} />
        {/* Ações de Hoje */}
        {currentActions?.length ? (
          <div className="mb-8">
            <div className="flex justify-between py-8">
              <div className="flex">
                <div className="relative flex">
                  <h2 className="text-3xl font-semibold tracking-tight capitalize">
                    {isToday(currentDay)
                      ? "hoje"
                      : formatRelative(currentDay, new Date(), {
                          locale: ptBR,
                        }).split("às")[0]}
                  </h2>
                  <Badge value={currentActions?.length} />
                </div>
                <Button
                  onClick={() => setCurrentDay(subDays(currentDay, 1))}
                  size={"icon"}
                  variant={"ghost"}
                  className="ml-12"
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <Button
                  onClick={() => setCurrentDay(addDays(currentDay, 1))}
                  size={"icon"}
                  variant={"ghost"}
                  className=""
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                {[
                  {
                    id: "kanban",
                    title: "Kanban",
                    description: "Ver o Kanban de progresso",
                    Icon: <KanbanIcon className="w-6" />,
                  },
                  {
                    id: "feed",
                    title: "Feed",
                    description: "Ver as ações do feed do Instagram",
                    Icon: <GridIcon className="w-6" />,
                  },
                  {
                    id: "categories",
                    title: "Categorias",
                    description: "Ver por categorias",
                    Icon: <ComponentIcon className="w-6" />,
                  },
                  {
                    id: "hours",
                    title: "Horas",
                    description: "Ver por horas do dia",
                    Icon: <CalendarClock className="w-6" />,
                  },
                ].map((button) => (
                  <Button
                    key={button.id}
                    variant={todayView === button.id ? "default" : "ghost"}
                    size={"sm"}
                    title={button.description}
                    className="flex items-center gap-2"
                    onClick={() => {
                      setTodayView(
                        button.id as "kanban" | "hours" | "categories",
                      );
                    }}
                  >
                    {button.Icon}
                    <div className="hidden md:block">{button.title}</div>
                  </Button>
                ))}
              </div>
            </div>

            {todayView === "kanban" ? (
              <Kanban actions={currentActions} />
            ) : todayView === "hours" ? (
              <HoursView actions={currentActions} />
            ) : todayView === "feed" ? (
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {getActionsByState(
                  getInstagramFeed({ actions: currentActions }) as Action[],
                  states,
                ).map((action) => {
                  const partner = partners.filter(
                    (p) => p.slug === action.partners[0],
                  )[0];
                  return (
                    <div className="flex flex-col gap-4" key={action.id}>
                      <div className="flex justify-between gap-4">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <Avatar
                            item={{
                              short: partner.short,
                              bg: partner.colors[0],
                              fg: partner.colors[1],
                            }}
                            size="xs"
                          />
                          <div className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap">
                            {partner.title}
                          </div>
                        </div>
                        <Icons
                          id={action.category}
                          className="size-4 shrink-0 opacity-25"
                        />
                      </div>
                      <ActionLine
                        action={action}
                        date={{ timeFormat: 1 }}
                        showContent
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <CategoriesView actions={currentActions} />
            )}
          </div>
        ) : null}
        {/* Ações de Amanhã */}
        {tomorrowActions?.length ? (
          <div className="mb-8">
            <div className="relative inline-flex pb-4">
              <h2 className="text-3xl font-semibold tracking-tight">Amanhã</h2>
              <Badge value={tomorrowActions?.length} />
            </div>

            <BlockOfActions actions={tomorrowActions} sprint />
          </div>
        ) : null}
        {/* Ações da Semana */}
        {weekActions.reduce(
          (acc, currentValue) => acc + currentValue.actions.length,
          0,
        ) ? (
          <WeekView
            weekActions={weekActions}
            setDraggedAction={setDraggedAction}
          />
        ) : null}
        {/* Próximas ações */}
        <div className="py-4">
          <div className="relative inline-flex pb-4">
            <h2 className="text-3xl font-semibold tracking-tight">
              Próximas Ações
            </h2>
            <Badge value={nextActions?.length || 0} />
          </div>
          <ListOfActions
            actions={nextActions}
            columns={person.role > 1 ? 1 : 3}
            isFoldable={person.role === 1}
            long
            orderBy="time"
          />
        </div>
      </div>
    </div>
  );
}

export function WeekView({
  weekActions,
  setDraggedAction,
}: {
  weekActions: { date: Date; actions: Action[] }[];
  setDraggedAction: React.Dispatch<SetStateAction<Action | undefined>>;
}) {
  return (
    <div className="py-4">
      <div className="pb-4">
        <h2 className="text-3xl font-semibold tracking-tight">Semana</h2>
      </div>
      <div className="scrollbars-horizontal mb-8 flex max-h-[50dvh] flex-nowrap overflow-x-auto overflow-y-hidden">
        {weekActions.map(({ date, actions }) => (
          <div
            className="group flex max-h-full w-full min-w-72 flex-col overflow-hidden"
            key={date.getDate()}
            data-date={format(date, "yyyy-MM-dd")}
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
          >
            {/* Dia */}
            <div className="flex shrink-0 items-center justify-between">
              <div className="font-semibold text-nowrap text-ellipsis first-letter:capitalize">
                {format(date, "EEEE ", { locale: ptBR })}
              </div>
              <div className="text-center opacity-0 group-hover:opacity-100">
                <CreateAction mode="day" date={format(date, "yyyy-MM-dd")} />
              </div>
            </div>
            {/* Data */}
            <div className="text-muted-foreground mb-4 text-[10px] font-medium tracking-widest uppercase">
              {format(date, "d 'de' MMMM", {
                locale: ptBR,
              })}
            </div>

            {/* Lista de Ações do dia */}
            <div className="scrollbars scrollbars-thin overflow-hidden p-1">
              <ListOfActions
                actions={actions}
                date={{ timeFormat: 1 }}
                showCategory={true}
                onDrag={setDraggedAction}
                short
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HoursView({ actions }: { actions: Action[] }) {
  return (
    <div className="gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
      {[
        [0, 1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10, 11],
        [12, 13, 14, 15, 16, 17],
        [18, 19, 20, 21, 22, 23],
      ].map((columns, i) => (
        <div key={i}>
          {columns.map((hour, j) => {
            const hourActions = actions.filter(
              (action) => new Date(action.date).getHours() === hour,
            );
            return (
              <div key={j} className="flex min-h-10 gap-2 border-t py-2">
                <div
                  className={`text-xs font-bold ${
                    hourActions.length === 0 ? "opacity-15" : ""
                  }`}
                >
                  {hour}h
                </div>
                <div className="w-full">
                  <ListOfActions
                    actions={hourActions}
                    showCategory={true}
                    columns={1}
                    date={{
                      dateFormat: 0,
                      timeFormat: 1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DelayedActions({ actions }: { actions: Action[] }) {
  const [order, setOrder] = useState<"state" | "priority" | "time">("state");
  const [view, setView] = useState<"list" | "category">("list");

  return (
    <div className="mb-4">
      <div className="flex justify-between py-8">
        <div className="relative flex">
          <h2 className="text-3xl font-semibold tracking-tight">Atrasados</h2>
          <Badge value={actions.length} />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground hidden text-[10px] font-semibold tracking-widest uppercase md:block">
              Ordenar por
            </div>
            <Button
              size={"sm"}
              variant={order === "state" ? "secondary" : "ghost"}
              onClick={() => {
                setOrder("state");
              }}
            >
              <ListTodoIcon className="size-4" />
            </Button>
            <Button
              size={"sm"}
              variant={order === "priority" ? "secondary" : "ghost"}
              onClick={() => {
                setOrder("priority");
              }}
            >
              <SignalIcon className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground hidden text-[10px] font-semibold tracking-widest uppercase md:block">
              Categorizar por
            </div>
            <Button
              size={"sm"}
              variant={view === "list" ? "secondary" : "ghost"}
              onClick={() => {
                setView("list");
              }}
            >
              <ListIcon className="size-4" />
            </Button>
            <Button
              size={"sm"}
              variant={view === "category" ? "secondary" : "ghost"}
              onClick={() => {
                setView("category");
              }}
            >
              <ComponentIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <ListOfActions
          actions={actions}
          showCategory={true}
          columns={6}
          date={{ dateFormat: 1 }}
          descending
          orderBy={order}
          showPartner
        />
      ) : (
        <CategoriesView actions={actions} />
      )}
    </div>
  );
}

function Partners({ actions }: { actions?: Action[] }) {
  const matches = useMatches();
  const { partners } = matches[1].data as DashboardRootType;
  const lateActions = getDelayedActions({ actions }) as (ActionChart & {
    partners: string[];
  })[];

  actions = actions || [];

  return (
    <div className="flex justify-center">
      <div className="mx-auto my-8 rounded p-2 md:p-8">
        <h4 className="mb-4 text-center text-xl font-bold">Parceiros</h4>
        {partners.length > 0 ? (
          <div className="mx-auto grid w-auto justify-center gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {partners.map((partner) => (
              <Link
                tabIndex={0}
                to={`/dashboard/${partner.slug}`}
                key={partner.slug}
                className="group/avatar relative flex cursor-pointer"
              >
                <CircularProgress
                  actions={actions.filter(
                    (action) =>
                      action.partners[0] === partner.slug &&
                      new Date(action.date).getTime() >=
                        startOfWeek(new Date()).getTime() &&
                      new Date(action.date).getTime() <=
                        endOfDay(endOfWeek(new Date())).getTime(),
                  )}
                  size="md"
                  className="scale-125"
                />
                <div>
                  <Avatar
                    item={{
                      short: partner.short,
                      bg: partner.colors[0],
                      fg: partner.colors[1],
                    }}
                    size="xl"
                    className="mx-auto"
                  />
                  <Badge
                    value={
                      lateActions.filter((action) =>
                        action.partners.find((p) => p === partner.slug),
                      ).length
                    }
                    isDynamic
                    className="border-background absolute -top-2 right-0 border-2"
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid place-content-center p-4 text-center">
            <div className="mb-2 text-4xl font-semibold tracking-tighter text-rose-600">
              Nenhum <span className="font-bold">PARCEIRO</span> está designado
              para você.
            </div>
            <div className="text-lg tracking-tight">
              Fale com o seu Head para viabilizar o seu acesso
              <br />
              aos parceiros da empresa que você deve ter acesso.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesView({ actions }: { actions: Action[] }) {
  const matches = useMatches();
  const { categories } = matches[1].data as DashboardRootType;

  return (
    <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div key={category.slug}>
          <div className="mb-2 flex items-center gap-2">
            {<Icons id={category.slug} className={`size-4`} />}

            <h4 className="font-bold">{category.title}</h4>
          </div>

          <ListOfActions
            actions={actions.filter(
              (action) => action.category === category.slug,
            )}
            isFoldable
            showPartner
          />
        </div>
      ))}
    </div>
  );
}

const ActionsProgress = () => {
  const matches = useMatches();

  const { states } = matches[1].data as DashboardRootType;
  const { actions } = matches[2].data as DashboardIndexType;

  const todayActions = actions?.filter((action) => isToday(action.date));
  const thisWeekActions = actions?.filter(
    (action) =>
      isAfter(action.date, startOfWeek(new Date())) &&
      isBefore(action.date, endOfWeek(new Date())),
  );
  const thisMonthActions = actions?.filter((action) =>
    isSameMonth(action.date, new Date()),
  );
  const nextMonthActions = actions?.filter((action) =>
    isSameMonth(action.date, addMonths(new Date(), 1)),
  );

  return (
    <div className="pb-8">
      {/* <h2 className="my-8 text-center text-3xl leading-none font-semibold tracking-tight">
        <span className="hidden md:block">Acompanhamento do progresso</span>
        <span className="md:hidden">Progresso</span>
      </h2> */}

      <h2 className="py-8 text-5xl leading-none font-bold tracking-tight">
        <span className="hidden uppercase md:block">
          Acompanhamento <br /> do progresso
        </span>
        <span className="md:hidden">Progresso</span>
      </h2>

      <div className="grid w-full grid-cols-2 justify-center gap-4 rounded select-none md:grid-cols-4">
        {/* <div>
          <h3 className="overflow-hidden text-center text-xl leading-none font-semibold text-ellipsis whitespace-nowrap capitalize">
            Hoje
          </h3>
          <div className="flex gap-4">
            <div className="w-full">
              <ChartContainer
                config={{}}
                className="aspect-square max-h-40 w-full"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Pie
                    dataKey={"actions"}
                    nameKey={"state"}
                    innerRadius={"60%"}
                    data={states.map((state) => {
                      return {
                        state: state.title,
                        actions: todayActions.filter(
                          (action) => action.state === state.slug,
                        ).length,
                        fill: state.color,
                      };
                    })}
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        </div> */}

        {[
          {
            title: "Hoje",
            actions: todayActions,
          },
          {
            title: "Semana",
            actions: thisWeekActions,
          },
          {
            title: format(new Date(), "MMMM", { locale: ptBR }),
            actions: thisMonthActions,
          },
          {
            title: format(addMonths(new Date(), 1), "MMMM", { locale: ptBR }),
            actions: nextMonthActions,
          },
        ].map(({ actions, title }, i) => (
          <motion.div
            key={i}
            className="hover:bg-secondary rounded-xl px-4 py-8 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="mb-1 text-xl leading-none font-semibold capitalize">
              {title}
            </h3>
            <div className="text-xs font-medium tracking-wide uppercase opacity-75">
              {actions.length} ações
            </div>
            <div className="flex gap-4">
              <div className="w-full">
                <ChartContainer
                  config={{}}
                  className="aspect-square max-h-40 w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Pie
                      dataKey={"actions"}
                      nameKey={"state"}
                      innerRadius={"60%"}
                      data={states.map((state) => {
                        return {
                          state: state.title,
                          actions: actions.filter(
                            (action) => action.state === state.slug,
                          ).length,
                          fill: state.color,
                        };
                      })}
                    />
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* <div className="w-full">
          <h3 className="mb-2 overflow-hidden text-center text-xl leading-none font-semibold text-ellipsis whitespace-nowrap">
            Durante o ano
          </h3>
          <ChartContainer config={{}} className="max-h-40 min-h-20 w-full">
            <LineChart data={dataLineChart} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={"month"} />
              

              {categories.map((category) => (
                <Line
                  key={category.slug}
                  type={"monotone"}
                  dataKey={category.slug}
                  strokeWidth={2}
                  stroke={category.color}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div> */}
    </div>
  );
};

function Sprint() {
  const matches = useMatches();
  let { actions } = useLoaderData<typeof loader>();
  let { sprints } = matches[1].data as DashboardRootType;

  const pendingSprints = usePendingData().sprints;
  const deletingIDsSprints = useIDsToRemove().sprints;

  //Sprints
  // Transform into a Map
  const sprintsMap = new Map<string, Sprint>(
    sprints.map((sprint) => [sprint.action_id, sprint]),
  );
  // Add pending Created/Updated Actions
  for (const sprint of pendingSprints as Sprint[]) {
    sprintsMap.set(sprint.action_id, sprint);
  }
  // Remove pending deleting Actions
  for (const ids of deletingIDsSprints) {
    sprintsMap.delete(ids.action_id);
  }
  // transform
  sprints = Array.from(sprintsMap, ([, v]) => v);

  const [order, setOrder] = useState<ORDER>("state");
  const [descending, setDescending] = useState(false);
  const ids = new Set(sprints?.map((s) => s.action_id));

  actions = actions?.filter((a) => ids.has(a.id)) || [];

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between py-8">
        <div className="relative flex">
          <h2 className="text-3xl font-semibold tracking-tight">Sprints</h2>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={order}
            onValueChange={(value) => setOrder(value as ORDER)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="state">Status</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="time">Data</SelectItem>
            </SelectContent>
          </Select>
          <Toggle
            variant={"outline"}
            pressed={descending}
            onPressedChange={(pressed) => setDescending(pressed)}
          >
            {descending ? (
              <ArrowDownIcon className="size-4" />
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </Toggle>
          {actions.length > 0 && (
            <div
              className={`flex items-center gap-1 rounded p-1 px-4 text-sm font-semibold whitespace-nowrap text-white ${actions.reduce((a, b) => a + b.time, 0) > 70 ? "bg-rose-500" : actions.reduce((a, b) => a + b.time, 0) > 30 ? "bg-amber-500" : "bg-lime-500"}`}
            >
              <TimerIcon className="size-4 opacity-75" />
              <span>{actions.reduce((a, b) => a + b.time, 0)} minutos</span>
            </div>
          )}
        </div>
      </div>

      {actions?.length > 0 ? (
        <BlockOfActions
          actions={actions}
          orderBy={order}
          descending={descending}
        />
      ) : (
        <div className="flex items-center gap-2">
          <RabbitIcon className="size-8 opacity-25" />
          <span>Nenhuma ação no sprint atual</span>
        </div>
      )}
    </div>
  );
}
