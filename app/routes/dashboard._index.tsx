import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from "@vercel/remix";
import { Link, useLoaderData, useMatches, useSubmit } from "@remix-run/react";
import {
	addDays,
	addMonths,
	eachDayOfInterval,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	isThisMonth,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, KanbanIcon } from "lucide-react";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { ListOfActions } from "~/components/structure/Action";
import CreateAction from "~/components/structure/CreateAction";
import Progress from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import { INTENTS } from "~/lib/constants";
import {
	AvatarClient,
	getActionsForThisDay,
	getDelayedActions,
	getNotFinishedActions,
	sortActions,
	useIDsToRemove,
	usePendingActions,
} from "~/lib/helpers";
import { SupabaseServerClient } from "~/lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { headers, supabase } = SupabaseServerClient({ request });

	const { data: actions } = await supabase
		.from("actions")
		.select("*")
		.gte(
			"date",
			format(
				startOfDay(startOfWeek(startOfMonth(new Date()))),
				"yyyy-MM-dd HH:mm:ss"
			)
		)
		.lte(
			"date",
			format(
				endOfDay(endOfWeek(endOfMonth(addMonths(new Date(), 1)))),
				"yyyy-MM-dd HH:mm:ss"
			)
		);

	return json({ actions }, { headers });
};

export const meta: MetaFunction = () => {
	return [
		{ title: "Dashboard / Ruller" },
		{ name: "description", content: "Welcome to Ruller!" },
	];
};

export default function DashboardIndex() {
	let { actions } = useLoaderData<typeof loader>();
	const matches = useMatches();
	const submit = useSubmit();
	const [draggedAction, setDraggedAction] = useState<Action>();
	const [todayView, setTodayView] = useState<"kanban" | "hours">("hours");

	invariant(actions);

	const { categories, priorities, states, clients } = matches[1]
		.data as DashboardDataType;

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
	const notFinishedActions = getNotFinishedActions({ actions });

	useEffect(() => {
		if (draggedAction) {
			const day = document.querySelector(".dragover") as HTMLElement;
			const date = day?.getAttribute("data-date") as string;

			//
			submit(
				{
					...draggedAction,
					date: date?.concat(
						`T${new Date(draggedAction.date).getHours()}:${new Date(
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
			//reset
			setDraggedAction(undefined);
		}
	}, [draggedAction, submit]);

	return (
		<div className="overflow-hidden">
			<div className="scrollbars mt-16 px-4 md:px-8">
				<Progress
					className={"mt-4"}
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
					<div className="mb-4">
						<div className="flex justify-between py-8">
							<h2 className="text-3xl font-medium tracking-tight">
								Atrasados ({lateActions?.length})
							</h2>
						</div>

						<ListOfActions
							categories={categories}
							priorities={priorities}
							states={states}
							actions={lateActions}
							showCategory={true}
							columns={6}
							date={{ dateFormat: 1 }}
							clients={clients}
						/>
					</div>
				) : null}
				{/* Clientes - Parceiros - Contas */}
				<div className="mb-8 mt-4">
					<h4 className="mb-4 text-xl font-medium">Contas</h4>
					<div className="flow mx-auto flex w-auto flex-wrap justify-center gap-4">
						{clients.map((client) => (
							<Link
								to={`/dashboard/${client.slug}`}
								key={client.id}
								className="group relative"
							>
								<AvatarClient
									client={client}
									size="lg"
									className="mx-auto"
								/>
								{/* <div className="absolute w-full -translate-y-4 overflow-hidden  text-center text-[10px] font-medium uppercase leading-tight opacity-100 transition duration-500 group-hover:translate-y-2 group-hover:opacity-100">
                  {client.title}
                </div> */}
							</Link>
						))}
					</div>
				</div>
				{/* Ações de Hoje */}
				{todayActions?.length ? (
					<div className="mb-8">
						<div className="flex justify-between py-8">
							<h2 className="text-3xl font-medium tracking-tight">
								Hoje ({todayActions?.length})
							</h2>
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
							<div className="scrollbars-horizontal scrollbars-horizontal ">
								<div className="flex w-full gap-4 pb-4">
									{states.map((state) => (
										<div
											className="min-w-72"
											key={state.id}
										>
											<div className="mb-2 flex items-center gap-2">
												<div
													className={`size-4 rounded-full border-4 border-${state.slug}`}
												></div>
												<h4 className="font-medium">
													{state.title}
												</h4>
											</div>
											<ListOfActions
												categories={categories}
												priorities={priorities}
												states={states}
												clients={clients}
												showCategory={true}
												date={{
													dateFormat: 0,
													timeFormat: 1,
												}}
												actions={todayActions.filter(
													(action) =>
														action.state_id ===
														state.id
												)}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
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
														className={`text-xs font-medium ${
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
															categories={
																categories
															}
															priorities={
																priorities
															}
															states={states}
															actions={
																hourActions
															}
															showCategory={true}
															clients={clients}
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
				) : (
					<div className="grid place-content-center p-8 text-xl">
						<div className="space-y-4 rounded-xl bg-gray-900 p-8 text-center">
							<div>Nenhuma ação para hoje</div>
							<CreateAction mode="button" />
						</div>
					</div>
				)}
				{/* Ações de Amanhã */}
				{tomorrowActions?.length ? (
					<div className="mb-8">
						<div className="flex justify-between py-2">
							<h2 className="text-xl font-medium">
								Amanhã ({tomorrowActions?.length})
							</h2>
						</div>

						{tomorrowActions ? (
							<ListOfActions
								categories={categories}
								priorities={priorities}
								states={states}
								actions={tomorrowActions}
								clients={clients}
								columns={2}
								date={{
									dateFormat: 0,
									timeFormat: 1,
								}}
							/>
						) : null}
					</div>
				) : (
					<div className="grid place-content-center p-8 text-xl">
						<div className="space-y-4 rounded-lg bg-gray-900 p-8 text-center">
							<div>Nenhuma ação para hoje</div>
							<CreateAction mode="button" />
						</div>
					</div>
				)}

				<div className="mb-8">
					<div className="flex justify-between pb-4 pt-8">
						<h2 className="text-3xl font-medium tracking-tight">
							Semana
						</h2>
					</div>
					<div className="grid grid-cols-7 gap-2">
						{eachDayOfInterval({
							start: startOfWeek(new Date()),
							end: endOfWeek(new Date()),
						}).map((day) => (
							<div
								key={day.getDate()}
								data-date={format(day, "yyyy-MM-dd")}
								onDragOver={(e) => {
									e.stopPropagation();
									e.preventDefault();
									document
										.querySelectorAll(".dragover")
										.forEach((e) =>
											e.classList.remove("dragover")
										);
									e.currentTarget.classList.add("dragover");
								}}
							>
								<div className="overflow-hidden text-ellipsis text-nowrap font-semibold capitalize tracking-tight">
									{format(day, "EEEE ", { locale: ptBR })}{" "}
								</div>
								<div className="mb-4 text-[10px] uppercase tracking-widest text-muted-foreground">
									{format(day, "d 'de' MMMM", {
										locale: ptBR,
									})}
								</div>
								<ListOfActions
									categories={categories}
									priorities={priorities}
									states={states}
									actions={actions?.filter((action) =>
										isSameDay(action.date, day)
									)}
									clients={clients}
									date={{ timeFormat: 1 }}
									showCategory={true}
									onDrag={setDraggedAction}
								/>
							</div>
						))}
					</div>
				</div>

				<div className="mb-8">
					<div className="flex justify-between pb-4 pt-8">
						<h2 className="text-3xl font-medium tracking-tight">
							Próximas Ações ({notFinishedActions?.length})
						</h2>
					</div>
					{/* Nesse Mês */}
					<>
						<h4 className="pb-4 text-xl font-medium tracking-tight">
							Nesse Mês
						</h4>

						<ListOfActions
							categories={categories}
							priorities={priorities}
							states={states}
							actions={notFinishedActions.filter((action) =>
								isThisMonth(action.date)
							)}
							showCategory={true}
							columns={3}
							date={{ dateFormat: 2, timeFormat: 1 }}
							clients={clients}
							isFoldable={true}
						/>
					</>

					<>
						<h4 className="py-4 text-xl font-medium tracking-tight">
							<span className="capitalize">
								{format(addMonths(new Date(), 1), "MMMM", {
									locale: ptBR,
								})}
							</span>
							{format(addMonths(new Date(), 1), " 'de' yyyy", {
								locale: ptBR,
							})}
						</h4>

						<ListOfActions
							categories={categories}
							priorities={priorities}
							states={states}
							actions={notFinishedActions.filter((action) =>
								isSameMonth(
									action.date,
									addMonths(new Date(), 1)
								)
							)}
							showCategory={true}
							columns={3}
							date={{ dateFormat: 2, timeFormat: 1 }}
							clients={clients}
							isFoldable={true}
						/>
					</>
				</div>
				{/* </ScrollArea> */}
			</div>
		</div>
	);
}
