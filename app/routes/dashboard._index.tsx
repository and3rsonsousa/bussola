import {
  Link,
  redirect,
  useLoaderData,
  useMatches,
  useOutletContext,
  useSubmit,
} from "@remix-run/react";
import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@vercel/remix";
import {
  addDays,
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
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { id, ptBR } from "date-fns/locale";
import {
  CalendarClock,
  ComponentIcon,
  KanbanIcon,
  ListIcon,
  ListTodoIcon,
  RabbitIcon,
  SignalIcon,
  TimerIcon,
} from "lucide-react";
import { useEffect, useState, type SetStateAction } from "react";
import { CartesianGrid, Line, LineChart, Pie, PieChart, XAxis } from "recharts";

import {
  ActionBlock,
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
import { INTENTS } from "~/lib/constants";
import {
  Avatar,
  Icons,
  getActionsByState,
  getActionsForThisDay,
  getDelayedActions,
  sortActions,
  useIDsToRemove,
  usePendingActions,
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

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", user.id)
    .single();

  let start = startOfWeek(startOfMonth(new Date()));
  let end = endOfDay(endOfWeek(endOfMonth(addMonths(new Date(), 1))));
  const [{ data: actions }, { data: actionsChart }] = await Promise.all([
    supabase
      .from("actions")
      .select("*")
      .is("archived", false)
      .contains("responsibles", person?.admin ? [] : [user.id])
      .gte("date", format(start, "yyyy-MM-dd HH:mm:ss"))
      .lte("date", format(end, "yyyy-MM-dd HH:mm:ss"))
      .returns<Action[]>(),
    supabase
      .from("actions")
      .select("category, state, date")
      .is("archived", false)
      .contains("responsibles", person?.admin ? [] : [user.id])
      .returns<{ state: string; date: string }[]>(),
  ]);

  return json({ actions, actionsChart }, { headers });
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
  const [todayView, setTodayView] = useState<"kanban" | "hours" | "categories">(
    "kanban",
  );

  if (!actions) {
    actions = [];
  }

  const { person } = matches[1].data as DashboardRootType;

  const pendingActions = usePendingActions();
  const idsToRemove = useIDsToRemove();

  const actionsMap = new Map<string, Action>(
    actions.map((action) => [action.id, action]),
  );

  for (const action of pendingActions as Action[]) {
    actionsMap.set(action.id, action);
  }

  for (const id of idsToRemove) {
    actionsMap.delete(id);
  }

  actions = sortActions(Array.from(actionsMap, ([, v]) => v));

  const lateActions = getDelayedActions({
    actions: actions as Action[],
  }) as Action[];
  const todayActions = getActionsForThisDay({ actions });
  const tomorrowActions = getActionsByState(
    getActionsForThisDay({
      actions,
      date: addDays(new Date(), 1),
    }),
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
        {todayActions?.length ? (
          <div className="mb-8">
            <div className="flex justify-between py-8">
              <div className="relative flex">
                <h2 className="text-3xl font-semibold tracking-tight">Hoje</h2>
                <Badge value={todayActions?.length} />
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
                    variant={todayView === button.id ? "secondary" : "ghost"}
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
              <Kanban actions={todayActions} />
            ) : todayView === "hours" ? (
              <HoursView actions={todayActions} />
            ) : (
              <CategoriesView actions={todayActions} />
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

            <BlockOfActions actions={tomorrowActions} />
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
              <div className="text-ellipsis text-nowrap font-semibold first-letter:capitalize">
                {format(date, "EEEE ", { locale: ptBR })}
              </div>
              <div className="text-center opacity-0 group-hover:opacity-100">
                <CreateAction mode="day" date={format(date, "yyyy-MM-dd")} />
              </div>
            </div>
            {/* Data */}
            <div className="mb-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
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
            <div className="hidden text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:block">
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
            <div className="hidden text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:block">
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
    partner: string;
  })[];

  actions = actions || [];

  return (
    <div className="mx-auto my-8 w-auto rounded p-2 md:p-8">
      <h4 className="mb-4 text-center text-xl font-bold">Parceiros</h4>
      {partners.length > 0 ? (
        <div className="mx-auto flex w-auto flex-wrap justify-center gap-8">
          {partners.map((partner) => (
            <Link
              tabIndex={0}
              to={`/dashboard/${partner.slug}`}
              key={partner.slug}
              className="group/avatar relative cursor-pointer rounded-full outline-none"
            >
              {/* ring-ring ring-offset-2 ring-offset-background focus:ring-2 */}
              <CircularProgress
                actions={actions.filter(
                  (action) =>
                    action.partner === partner.slug &&
                    new Date(action.date).getTime() >=
                      startOfWeek(new Date()).getTime() &&
                    new Date(action.date).getTime() <=
                      endOfDay(endOfWeek(new Date())).getTime(),
                )}
                size="md"
                className="scale-50 transition duration-500 group-hover/avatar:scale-100 group-focus/avatar:scale-100"
              />
              <Avatar
                item={{
                  short: partner.short,
                  bg: partner.colors[0],
                  fg: partner.colors[1],
                }}
                size="lg"
                className="mx-auto"
              />
              <Badge
                value={
                  lateActions.filter(
                    (action) => action.partner === partner.slug,
                  ).length
                }
                isDynamic
                className="-translate-y-1 translate-x-2 border-2 border-background"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid place-content-center p-4 text-center">
          <div className="mb-2 text-4xl font-semibold tracking-tighter text-error-600">
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
          />
        </div>
      ))}
    </div>
  );
}

const ActionsProgress = () => {
  const matches = useMatches();

  const { states, categories } = matches[1].data as DashboardRootType;
  const { actions, actionsChart } = matches[2].data as DashboardIndexType;

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

  const year = eachMonthOfInterval({
    start: startOfYear(new Date()),
    end: endOfYear(new Date()),
  });

  // const lineConfig = categories.reduce(
  //   (acc, curr) => ({
  //     ...acc,
  //     [curr.slug]: { label: curr.title, color: curr.color },
  //   }),
  //   {},
  // );

  const dataLineChart = year.map((month) => ({
    month: format(month, "MMM", { locale: ptBR }),
    todas: actionsChart.filter((action) => isSameMonth(action.date, month))
      .length,
    ...categories.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.slug]: actionsChart.filter(
          (action) =>
            isSameMonth(month, action.date) && curr.slug === action.category,
        ).length,
      }),
      {},
    ),
  }));

  return (
    <div>
      <h2 className="my-8 text-3xl font-semibold leading-none tracking-tight">
        <span className="hidden md:block">Acompanhamento do progresso</span>
        <span className="md:hidden">Progresso</span>
      </h2>
      <div className="gap-8 lg:flex">
        <div className="grid w-full select-none grid-cols-3 gap-2">
          {[
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
            <div key={i}>
              <h3 className="mb-2 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xl font-semibold capitalize leading-none">
                {title}
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
            </div>
          ))}
        </div>
        <div className="w-full">
          <h3 className="mb-2 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xl font-semibold leading-none">
            Durante o ano
          </h3>
          <ChartContainer config={{}} className="max-h-40 min-h-20 w-full">
            <LineChart data={dataLineChart} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={"month"} />
              {/* <ChartTooltip cursor={false} content={<ChartTooltipContent />} /> */}

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
        </div>
      </div>
    </div>
  );
};

function Sprint() {
  let { actions } = useLoaderData<typeof loader>();

  const matches = useMatches();
  const { sprints } = matches[1].data as DashboardRootType;
  const ids = new Set(sprints?.map((s) => s.action_id));

  actions = actions?.filter((a) => ids.has(a.id)) || [];

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between py-8">
        <div className="relative flex">
          <h2 className="text-3xl font-semibold tracking-tight">Sprints</h2>
        </div>
        {actions.length > 0 && (
          <div
            className={`flex items-center gap-1 rounded p-1 px-4 text-sm font-semibold text-white ${actions.reduce((a, b) => a + b.time, 0) > 70 ? "bg-error-500" : actions.reduce((a, b) => a + b.time, 0) > 30 ? "bg-alert-500" : "bg-success-500"}`}
          >
            <TimerIcon className="size-4 opacity-75" />
            <span>{actions.reduce((a, b) => a + b.time, 0)} minutos</span>
          </div>
        )}
      </div>
      <div className="rounded-xl border-2 p-8">
        {actions?.length > 0 ? (
          <BlockOfActions actions={actions} />
        ) : (
          <div className="flex items-center gap-2">
            <RabbitIcon className="size-8 opacity-25" />
            <span>Nenhuma ação no sprint atual</span>
          </div>
        )}
      </div>
    </div>
  );
}
