import {
  Link,
  redirect,
  useLoaderData,
  useMatches,
  useSubmit,
} from "@remix-run/react";
import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@vercel/remix";
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarClock,
  ComponentIcon,
  KanbanIcon,
  ListIcon,
  ListTodoIcon,
  SignalIcon,
} from "lucide-react";
import { useEffect, useState, type SetStateAction } from "react";
import { BlockOfActions, ListOfActions } from "~/components/structure/Action";
import Badge from "~/components/structure/Badge";
import CreateAction from "~/components/structure/CreateAction";
import Kanban from "~/components/structure/Kanban";
import Progress from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import { INTENTS, STATES } from "~/lib/constants";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
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

  const { data: actions } = await supabase
    .from("get_full_actions")
    .select("*")
    .contains("responsibles", person?.admin ? [] : [user.id])

    .returns<Action[]>();

  return json({ actions }, { headers });
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
  const [draggedAction, setDraggedAction] = useState<Action>();
  const [todayView, setTodayView] = useState<"kanban" | "hours" | "categories">(
    "kanban",
  );

  if (!actions) {
    actions = [];
  }

  const { states, person } = matches[1].data as DashboardDataType;

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

  const lateActions = getDelayedActions({ actions: actions as Action[] });
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
  const nextActions = actions?.filter(
    (action) => action.state_id != STATES.finish,
  );

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

  return (
    <div className="overflow-hidden">
      <div className="scrollbars px-4 md:px-8">
        <Progress
          long={true}
          className={"fixed right-0 top-0 z-50 w-full"}
          values={states.map((state) => ({
            id: state.id,
            title: state.title,
            value: actions?.filter((action) => action.state_id === state.id)
              .length,
            color: `bg-${state.slug}`,
          }))}
          total={actions?.length || 0}
        />

        {/* Ações em Atraso */}
        {lateActions?.length ? <DelayedActions actions={lateActions} /> : null}
        {/* Parceiros */}

        <Partners actions={lateActions} />

        {person.role === 1 && (
          <>
            {/* Ações de Hoje */}
            {todayActions?.length ? (
              <div className="mb-8">
                <div className="flex justify-between py-8">
                  <div className="relative flex">
                    <h2 className="text-3xl font-extrabold uppercase tracking-tighter">
                      Hoje
                    </h2>
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
                        variant={todayView === button.id ? "accent" : "ghost"}
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
                  <h2 className="text-3xl font-extrabold uppercase tracking-tighter">
                    Amanhã
                  </h2>
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
          </>
        )}
        <div className="mb-8">
          <div className="relative inline-flex pb-4">
            <h2 className="text-3xl font-extrabold uppercase tracking-tighter">
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
    <div className="pt-8">
      <div className="pb-4">
        <h2 className="text-3xl font-extrabold uppercase tracking-tighter">
          Semana
        </h2>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekActions.map(({ date, actions }) => (
          <div
            className="group"
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
            <div
              className="overflow-hidden text-ellipsis text-nowrap font-bold uppercase leading-none"
              style={{ fontStretch: "75%" }}
            >
              {format(date, "EEEE ", { locale: ptBR })}
            </div>
            {/* Data */}
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {format(date, "d 'de' MMMM", {
                locale: ptBR,
              })}
            </div>
            {/* Lista de Ações do dia */}
            <ListOfActions
              actions={actions}
              date={{ timeFormat: 1 }}
              showCategory={true}
              onDrag={setDraggedAction}
              short
            />
            <div className="mt-4 text-center opacity-0 transition group-hover:opacity-100">
              <CreateAction mode="day" date={date} />
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
          <h2 className="text-3xl font-extrabold uppercase tracking-tighter">
            Atrasados
          </h2>
          <Badge value={actions.length} />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase text-muted-foreground">
              Ordenar por
            </div>
            <Button
              size={"sm"}
              variant={order === "state" ? "accent" : "ghost"}
              onClick={() => {
                setOrder("state");
              }}
            >
              <ListTodoIcon className="size-4" />
            </Button>
            <Button
              size={"sm"}
              variant={order === "priority" ? "accent" : "ghost"}
              onClick={() => {
                setOrder("priority");
              }}
            >
              <SignalIcon className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase text-muted-foreground">
              Categorizar por
            </div>
            <Button
              size={"sm"}
              variant={view === "list" ? "accent" : "ghost"}
              onClick={() => {
                setView("list");
              }}
            >
              <ListIcon className="size-4" />
            </Button>
            <Button
              size={"sm"}
              variant={view === "category" ? "accent" : "ghost"}
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

function Partners({ actions }: { actions: Action[] }) {
  const matches = useMatches();
  const { partners } = matches[1].data as DashboardDataType;

  return (
    <div className="mb-8 mt-4">
      <h4 className="mb-4 text-center text-xl font-bold">Parceiros</h4>
      {partners.length > 0 ? (
        <div className="flow mx-auto flex w-auto flex-wrap justify-center gap-4">
          {partners.map((partner) => (
            <Link
              to={`/dashboard/${partner.slug}`}
              key={partner.id}
              className="group relative rounded-full outline-none ring-ring focus:ring-2"
            >
              <Avatar
                item={{
                  short: partner.short,
                  bg: partner.bg,
                  fg: partner.fg,
                }}
                size="lg"
                className="mx-auto"
              />
              <Badge
                value={
                  actions.filter((action) => action.partner_id === partner.id)
                    .length
                }
                isDynamic
                className="-translate-y-1 translate-x-2"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid place-content-center p-4 text-center">
          <div className="mb-2 text-4xl font-semibold tracking-tighter text-error-600">
            Nenhum <span className="font-extrabold">PARCEIRO</span> está
            designado para você.
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
  const { categories } = matches[1].data as DashboardDataType;

  return (
    <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="mb-2 flex items-center gap-2">
            {
              <Icons
                id={category.slug}
                className={`size-4 fg-${category.slug}`}
              />
            }

            <h4 className="font-bold">{category.title}</h4>
          </div>

          <ListOfActions
            actions={actions.filter(
              (action) => action.category_id === category.id,
            )}
            isFoldable
          />
        </div>
      ))}
    </div>
  );
}
