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
import { json, type LoaderFunctionArgs } from "@vercel/remix";
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
	startOfMonth,
	startOfWeek,
	startOfYear,
	subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { ActionLine, GridOfActions } from "~/components/structure/Action";
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
		.from("actions")
		.select("*")
		.eq("partner_id", partner!.id)
		.contains("responsibles", person?.admin ? [] : [user.id]);

	return json({ actions, partner }, { headers });
};

export default function Partner() {
	let { actions } = useLoaderData<typeof loader>();
	const { partner } = useLoaderData<typeof loader>();
	const [searchParams] = useSearchParams();

	const matches = useMatches();
	const submit = useSubmit();

	const [draggedAction, setDraggedAction] = useState<Action>();
	const [stateFilter, setStateFilter] = useState<State>();
	const [categoryFilter, setCategoryFilter] = useState<Category[]>([]);

	invariant(partner);

	const { categories, priorities, states, person, people } = matches[1]
		.data as DashboardDataType;

	const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
	const currentDate = parseISO(date);

	const actionsMap = new Map<string, Action>(
		actions?.map((action) => [action.id, action])
	);

	const days = eachDayOfInterval({
		start: startOfWeek(startOfMonth(currentDate)),
		end: endOfWeek(endOfMonth(currentDate)),
	});

	const pendingActions = usePendingActions();
	const idsToRemove = useIDsToRemove();

	for (const action of pendingActions as Action[]) {
		actionsMap.set(action.id, action);
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
								(category) => category.id === action.category_id
						  )
						: true) &&
					(stateFilter ? action.state_id === stateFilter?.id : true)
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
						date: date?.concat(
							`T${format(draggedAction.date, "HH:mm:ss")}`
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
		}
	}, [draggedAction, submit]);

	// useEffect(() => {
	// 	document
	// 		.querySelector("[data-radix-scroll-area-viewport]")!
	// 		.addEventListener("scroll", function (e: unknown) {
	// 			const header = document.querySelector("#daysheader");
	// 			const calendar = document.querySelector("#calendar");
	// 			const divider = document.querySelector("#divider");
	// 			if (
	// 				(e as React.UIEvent<HTMLElement>).currentTarget.scrollTop >
	// 				60
	// 			) {
	// 				header?.classList.add(
	// 					"fixed",
	// 					"top-[64px]",
	// 					"-ml-8",
	// 					"px-8"
	// 				);
	// 				calendar?.classList.add("mt-20");
	// 				divider?.classList.remove("hidden");
	// 			} else {
	// 				header?.classList.remove("fixed", "-ml-8", "px-8");
	// 				calendar?.classList.remove("mt-20");
	// 				divider?.classList.add("hidden");
	// 			}
	// 		});
	// }, []);

	return (
		<div className="lg:flex w-full gap-4 overflow-hidden">
			<div className="scrollbars scrollbars-thin w-full h-1/2">
				<div className="relative flex flex-col overflow-y-hidden">
					<div
						id="daysheader"
						className="z-10 w-full bg-background/25 backdrop-blur-lg"
					>
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
														to={`/dashboard/${
															partner.slug
														}/?date=${format(
															new Date().setMonth(
																month.getMonth()
															),
															"yyyy-MM-'01'"
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
										to={`/dashboard/${
											partner?.slug
										}?date=${format(
											subMonths(currentDate, 1),
											"yyyy-MM-dd"
										)}`}
									>
										<ChevronLeftIcon className="h-4 w-4" />
									</Link>
								</Button>
								<Button size="icon" variant="ghost" asChild>
									<Link
										to={`/dashboard/${
											partner?.slug
										}?date=${format(
											addMonths(currentDate, 1),
											"yyyy-MM-dd"
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
											{stateFilter
												? stateFilter.title
												: "Filtre pelo Status"}
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
												checked={
													state.id === stateFilter?.id
												}
												onCheckedChange={(checked) => {
													if (
														!checked &&
														state.id ===
															stateFilter?.id
													) {
														setStateFilter(
															undefined
														);
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
												categoryFilter.length > 0
													? "default"
													: "ghost"
											}
											className={`text-xs font-bold`}
										>
											{categoryFilter.length > 0 ? (
												<>
													<div>
														{categoryFilter
															.map(
																(category) =>
																	category.title
															)
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
											checked={
												categoryFilter?.length == 0
											}
											onCheckedChange={() => {
												setCategoryFilter([]);
											}}
										>
											<Icons
												className="h-3 w-3"
												id="all"
											/>
											<div>Todas as Categorias</div>
										</DropdownMenuCheckboxItem>
										{categories.map((category) => (
											<DropdownMenuCheckboxItem
												className="bg-select-item flex gap-2"
												key={category.id}
												checked={
													categoryFilter
														? categoryFilter?.findIndex(
																(c) =>
																	category.id ===
																	c.id
														  ) >= 0
														: false
												}
												onCheckedChange={(checked) => {
													if (
														!checked &&
														categoryFilter?.findIndex(
															(c) =>
																category.id ===
																c.id
														) >= 0
													) {
														const filters =
															categoryFilter.filter(
																(c) =>
																	c.id !=
																	category.id
															);

														setCategoryFilter(
															filters
														);
													} else {
														setCategoryFilter(
															categoryFilter
																? [
																		...categoryFilter,
																		category,
																  ]
																: [category]
														);
													}
												}}
											>
												<Icons
													id={category.slug}
													className="h-3 w-3"
												/>
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
												? "text-gray-100"
												: "text-gray-500"
										}
									>
										{format(day, "EEE", { locale: ptBR })}
									</div>
								);
							})}
						</div>
						<div
							id="divider"
							className="absolute bottom-0 hidden h-[1px] w-full bg-gradient-to-r from-transparent via-gray-700"
						></div>
					</div>
					<div
						id="calendar"
						className={`grid-cols-7 pb-4 text-gray-300 md:grid`}
					>
						{calendar.map((day, i) => (
							<CalendarDay
								key={i}
								categories={categories}
								priorities={priorities}
								states={states}
								currentDate={currentDate}
								day={day}
								setDraggedAction={setDraggedAction}
								partner={partner}
								person={person}
								people={people}
							/>
						))}
					</div>
				</div>
			</div>
			<div className="max-w-96">
				<GridOfActions
					categories={categories}
					priorities={priorities}
					states={states}
					actions={instagramActions}
				/>
			</div>
		</div>
	);
}

export const CalendarDay = ({
	day,
	currentDate,
	categories,
	priorities,
	states,
	setDraggedAction,
	partner,
	person,
}: {
	day: { date: Date; actions?: Action[] };
	currentDate: Date;
	categories: Category[];
	priorities: Priority[];
	states: State[];
	partner: Partner;
	person: Person;
	people: Person[];
	setDraggedAction: React.Dispatch<React.SetStateAction<Action | undefined>>;
}) => {
	const [isHover, setIsHover] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	const submit = useSubmit();

	function handleActions(data: {
		[key: string]: string | number | null | string[];
	}) {
		submit(
			{ ...data },
			{
				action: "/handle-actions",
				method: "post",
				navigate: false,
			}
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
			"yyyy-MM-dd'T'HH:mm:ss"
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
			} group/day relative flex flex-col border-t bg-gradient-to-b pb-4 pt-2 transition hover:from-gray-900 hover:via-transparent md:px-1 md:pt-0`}
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
			<div className="absolute -top-[1px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-500 opacity-0 transition group-hover/day:opacity-100"></div>

			<div className="my-1 flex justify-between">
				<div
					className={`grid h-6 w-6 place-content-center rounded-full text-xs font-medium ${
						isSameMonth(day.date, currentDate)
							? ""
							: "text-gray-700"
					} ${
						isToday(day.date)
							? "bg-primary text-primary-foreground"
							: "-ml-1"
					} `}
				>
					{day.date.getDate()}
				</div>
			</div>
			<div className="relative flex shrink-0 grow flex-col gap-3">
				{categories
					.map((category) => ({
						category,
						actions: day.actions?.filter(
							(action) => category.id === action.category_id
						),
					}))
					.map(({ category, actions }) =>
						actions && actions.length > 0 ? (
							<div
								key={category.id}
								className="flex flex-col gap-1"
							>
								<div className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
									{category.title}
								</div>
								{actions?.map((action) => (
									<ActionLine
										action={action}
										categories={categories}
										priorities={priorities}
										states={states}
										key={action.id}
										date={{
											timeFormat: 1,
										}}
										onDrag={setDraggedAction}
									/>
								))}
							</div>
						) : null
					)}
			</div>
			{isHover || isCreating ? (
				<div
					className={`absolute -bottom-2 left-1/2 z-10 mt-2 -translate-x-1/2  focus-within:relative`}
				>
					<div className="overflow-hidden rounded border border-white/10 bg-gray-950/50 p-1 ring-primary backdrop-blur-lg focus-within:ring-2">
						<Form
							method="post"
							className="flex items-center gap-1"
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
								className="block w-full bg-transparent p-0 text-xs font-medium outline-none placeholder:text-gray-700 hover:placeholder:text-gray-400"
								placeholder="Nova ação..."
								name="title"
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

							<button
								type={isCreating ? "submit" : "button"}
								onClick={(e) => {
									if (isCreating) {
										setIsCreating(false);
									} else {
										e.preventDefault();
										e.stopPropagation();
										setIsCreating(true);
									}
								}}
							>
								<PlusIcon className="h-4 w-4 text-gray-500" />
							</button>
						</Form>
					</div>
				</div>
			) : null}
		</div>
	);
};
