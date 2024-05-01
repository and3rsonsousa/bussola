import { Link, useLoaderData, useMatches, useSubmit } from "@remix-run/react";
import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@vercel/remix";
import {
	addDays,
	addMonths,
	eachDayOfInterval,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, KanbanIcon } from "lucide-react";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { ListOfActions } from "~/components/structure/Action";
import Badge from "~/components/structure/Badge";
import CreateAction from "~/components/structure/CreateAction";
import Kanban from "~/components/structure/Kanban";
import Progress from "~/components/structure/Progress";
import { Button } from "~/components/ui/button";
import { INTENTS } from "~/lib/constants";
import {
	AvatarPartner,
	getActionsForThisDay,
	getDelayedActions,
	sortActions,
	useIDsToRemove,
	usePendingActions,
} from "~/lib/helpers";
import { createClient } from "~/lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { headers, supabase } = createClient(request);

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
		{ title: "Bússola" },
		{
			name: "description",
			content:
				"Gerencie os aspectos principais dos seus projetos nessa página.",
		},
	];
};

export default function DashboardIndex() {
	let { actions } = useLoaderData<typeof loader>();
	const matches = useMatches();
	const submit = useSubmit();
	const [draggedAction, setDraggedAction] = useState<Action>();
	const [todayView, setTodayView] = useState<"kanban" | "hours">("kanban");

	invariant(actions);

	const { categories, priorities, states, partners } = matches[1]
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
	// const notFinishedActions = getNotFinishedActions({ actions });

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
					<div className="mb-4">
						<div className="flex justify-between py-8">
							<div className="flex relative">
								<h2 className="text-3xl font-extrabold text-gray-100 uppercase tracking-tighter">
									Atrasados
								</h2>
								<Badge
									value={lateActions?.length}
									className="-translate-y-1 translate-x-8"
								/>
							</div>
						</div>

						<ListOfActions
							categories={categories}
							priorities={priorities}
							states={states}
							actions={lateActions}
							showCategory={true}
							columns={6}
							date={{ dateFormat: 1 }}
							partners={partners}
						/>
					</div>
				) : null}
				{/* Clientes - Parceiros - Contas */}
				<div className="mb-8 mt-4">
					<h4 className="mb-4 text-xl text-center font-bold">
						Parceiros
					</h4>
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
												action.partner_id === partner.id
										).length
									}
									isDynamic
									className="-translate-y-2 translate-x-2"
								/>
							</Link>
						))}
					</div>
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
															partners={partners}
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
							<div className="font-semibold">
								Nenhuma ação para hoje
							</div>
							<CreateAction mode="button" />
						</div>
					</div>
				)}
				{/* Ações de Amanhã */}
				{tomorrowActions?.length ? (
					<div className="mb-8">
						<div className="inline-flex relative pb-4">
							<h2 className="text-xl font-bold">Amanhã</h2>
							<Badge
								value={tomorrowActions?.length}
								className="translate-x-8 -translate-y-1"
							/>
						</div>

						<ListOfActions
							categories={categories}
							priorities={priorities}
							states={states}
							actions={tomorrowActions}
							partners={partners}
							columns={6}
							date={{
								dateFormat: 0,
								timeFormat: 1,
							}}
						/>
					</div>
				) : (
					<div className="grid place-content-center p-8 text-xl">
						<div className="space-y-4 rounded-lg bg-gray-900 p-8 text-center">
							<div className="font-semibold">
								Nenhuma ação para amanhã
							</div>
							<CreateAction
								date={addDays(new Date(), 1)}
								mode="button"
							/>
						</div>
					</div>
				)}

				<div className="mb-8 pt-8">
					<div className="pb-4">
						<h2 className="text-3xl font-bold tracking-tight">
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
								<div className="overflow-hidden text-ellipsis text-nowrap font-bold capitalize tracking-tight">
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
									partners={partners}
									date={{ timeFormat: 1 }}
									showCategory={true}
									onDrag={setDraggedAction}
								/>
							</div>
						))}
					</div>
				</div>

				{/* </ScrollArea> */}
			</div>
		</div>
	);
}
