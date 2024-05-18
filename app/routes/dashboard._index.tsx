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
	KanbanIcon,
	ListTodoIcon,
	SignalIcon,
} from "lucide-react";
import { useEffect, useState, type SetStateAction } from "react";
import { ListOfActions } from "~/components/structure/Action";
import Badge from "~/components/structure/Badge";
import CreateAction from "~/components/structure/CreateAction";
import Kanban from "~/components/structure/Kanban";
import Progress from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import { INTENTS } from "~/lib/constants";
import {
	AvatarPartner,
	getActionsByPriority,
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

	const { data: actions } = await supabase
		.from("actions")
		.select("*")
		.contains("responsibles", [user.id])
		.gte(
			"date",
			format(
				startOfDay(startOfWeek(startOfMonth(new Date()))),
				"yyyy-MM-dd HH:mm:ss"
			)
		);

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
	const [todayView, setTodayView] = useState<"kanban" | "hours">("kanban");

	if (!actions) {
		actions = [];
	}

	const { states, partners } = matches[1].data as DashboardDataType;

	const pendingActions = usePendingActions();
	const idsToRemove = useIDsToRemove();

	const actionsMap = new Map<string, Action>(
		actions.map((action) => [action.id, action])
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
	const tomorrowActions = getActionsForThisDay({
		actions,
		date: addDays(new Date(), 1),
	});
	const weekActions = eachDayOfInterval({
		start: startOfWeek(new Date()),
		end: endOfWeek(new Date()),
	}).map((day) => ({
		date: day,
		actions: actions?.filter((action) =>
			isSameDay(action.date, day)
		) as Action[],
	}));

	useEffect(() => {
		if (draggedAction) {
			const day = document.querySelector(".dragover") as HTMLElement;
			const date = day?.getAttribute("data-date") as string;

			if (date !== format(draggedAction.date, "yyyy-MM-dd")) {
				//
				submit(
					{
						...draggedAction,
						date: date?.concat(
							`T${new Date(
								draggedAction.date
							).getHours()}:${new Date(
								draggedAction.date
							).getMinutes()}`
						),
						intent: INTENTS.updateAction,
					},
					{
						action: "/handle-actions",
						method: "POST",
						navigate: false,
						fetcherKey: `action:${draggedAction.id}:update:move:calendar`,
					}
				);
			}
			//reset
			setDraggedAction(undefined);
		}
	}, [draggedAction, submit]);

	return (
		<div className="overflow-hidden">
			<div className="scrollbars mt-16 pb-16 px-4 md:px-8">
				<Progress
					long={true}
					className={"fixed z-50 w-full top-0 right-0"}
					values={states.map((state) => ({
						id: state.id,
						title: state.title,
						value: actions?.filter(
							(action) => action.state_id === state.id
						).length,
						color: `bg-${state.slug}`,
					}))}
					total={actions?.length || 0}
				/>
				{/* Ações em Atraso */}
				{lateActions?.length ? (
					<LateActions actions={lateActions} />
				) : null}
				{/* Parceiros */}
				<div className="mb-8 mt-4">
					<h4 className="mb-4 text-xl text-center font-bold">
						Parceiros
					</h4>
					{partners.length > 0 ? (
						<div className="flow mx-auto flex w-auto flex-wrap justify-center gap-4">
							{partners.map((partner) => (
								<Link
									to={`/dashboard/${partner.slug}`}
									key={partner.id}
									className="group relative"
								>
									<AvatarPartner
										partner={partner}
										size="lg"
										className="mx-auto"
									/>
									<Badge
										value={
											lateActions.filter(
												(action) =>
													action.partner_id ===
													partner.id
											).length
										}
										isDynamic
										className="-translate-y-2 translate-x-2"
									/>
								</Link>
							))}
						</div>
					) : (
						<div className="p-4 grid place-content-center text-center">
							<div className="text-4xl text-error-600 tracking-tighter font-semibold mb-2">
								Nenhum{" "}
								<span className="font-extrabold">PARCEIRO</span>{" "}
								está designado para você.
							</div>
							<div className="text-lg tracking-tight font-normal">
								Fale com o seu Head para viabilizar o seu acesso
								<br />
								aos parceiros da empresa que você deve ter
								acesso.
							</div>
						</div>
					)}
				</div>

				{/* Ações de Hoje */}
				{todayActions?.length ? (
					<div className="mb-8">
						<div className="flex justify-between py-8">
							<div className="relative flex">
								<h2 className="text-3xl font-extrabold uppercase text-gray-100 tracking-tighter">
									Hoje
								</h2>
								<Badge
									value={todayActions?.length}
									className="-translate-y-1 translate-x-8"
								/>
							</div>
							<div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										setTodayView(() =>
											todayView === "hours"
												? "kanban"
												: "hours"
										);
									}}
								>
									{todayView === "kanban" ? (
										<KanbanIcon className="w-6" />
									) : (
										<CalendarClock className="w-6" />
									)}
								</Button>
							</div>
						</div>

						{todayView === "kanban" ? (
							<Kanban actions={todayActions} />
						) : (
							<div className="gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
								{[
									[0, 1, 2, 3, 4, 5],
									[6, 7, 8, 9, 10, 11],
									[12, 13, 14, 15, 16, 17],
									[18, 19, 20, 21, 22, 23],
								].map((columns, i) => (
									<div key={i}>
										{columns.map((hour, j) => {
											const hourActions =
												todayActions.filter(
													(action) =>
														new Date(
															action.date
														).getHours() === hour
												);
											return (
												<div
													key={j}
													className="flex min-h-10 gap-2 border-t py-2"
												>
													<div
														className={`text-xs font-bold ${
															hourActions.length ===
															0
																? "opacity-15"
																: ""
														}`}
													>
														{hour}h
													</div>
													<div className="w-full">
														<ListOfActions
															actions={
																hourActions
															}
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
						)}
					</div>
				) : null}
				{/* Ações de Amanhã */}
				{tomorrowActions?.length ? (
					<div className="mb-8">
						<div className="inline-flex relative pb-4">
							<h2 className="text-3xl font-extrabold uppercase text-gray-100 tracking-tighter">
								Amanhã
							</h2>
							<Badge
								value={tomorrowActions?.length}
								className="translate-x-8 -translate-y-1"
							/>
						</div>

						<ListOfActions
							showCategory
							actions={tomorrowActions}
							columns={6}
							date={{
								dateFormat: 0,
								timeFormat: 1,
							}}
						/>
					</div>
				) : null}

				{/* Ações da Semana */}
				{weekActions.reduce(
					(acc, currentValue) => acc + currentValue.actions.length,
					0
				) ? (
					<WeekView
						weekActions={weekActions}
						setDraggedAction={setDraggedAction}
					/>
				) : null}

				<div className="mb-8">
					<div className="inline-flex relative pb-4">
						<h2 className="text-3xl font-extrabold uppercase text-gray-100 tracking-tighter">
							Próximas Ações
						</h2>
						<Badge
							value={actions?.length || 0}
							className="translate-x-8 -translate-y-1"
						/>
					</div>
					<ListOfActions actions={actions} columns={3} isFoldable />
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
				<h2 className="text-3xl font-extrabold text-gray-100 uppercase tracking-tighter">
					Semana
				</h2>
			</div>
			<div className="grid grid-cols-7 gap-2">
				{weekActions.map(({ date, actions }) => (
					<div
						className="group pb-8"
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
					>
						{/* Dia */}
						<div
							className="overflow-hidden text-ellipsis text-nowrap font-bold uppercase tracking-wide"
							style={{ fontStretch: "75%" }}
						>
							{format(date, "EEEE ", { locale: ptBR })}
						</div>
						{/* Data */}
						<div className="mb-4 text-[10px] uppercase tracking-widest text-muted-foreground">
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
						/>
						<div className="mt-4 transition text-center group-hover:opacity-100 opacity-0">
							<CreateAction mode="day" date={date} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function LateActions({ actions }: { actions: Action[] }) {
	const [view, setView] = useState<"state" | "priority" | "time">("state");
	const [a, setA] = useState(actions);

	useEffect(() => {
		if (view === "priority") {
			setA(getActionsByPriority(actions));
		} else {
			setA(getActionsByState(actions));
		}
	}, [view, actions]);

	return (
		<div className="mb-4">
			<div className="flex justify-between py-8">
				<div className="flex relative">
					<h2 className="text-3xl font-extrabold text-gray-100 uppercase tracking-tighter">
						Atrasados
					</h2>
					<Badge
						value={a.length}
						className="-translate-y-1 translate-x-8"
					/>
				</div>
				<div>
					<Button
						variant={"ghost"}
						onClick={() => {
							if (view === "priority") {
								setView("state");
							} else {
								setView("priority");
							}
						}}
					>
						{view === "priority" ? (
							<SignalIcon className="size-4" />
						) : (
							<ListTodoIcon className="size-4" />
						)}
					</Button>
				</div>
			</div>

			<ListOfActions
				actions={a}
				showCategory={true}
				columns={6}
				date={{ dateFormat: 1 }}
			/>
		</div>
	);
}
