import {
	Form,
	Link,
	useMatches,
	useNavigate,
	useSubmit,
} from "@remix-run/react";
import {
	addDays,
	addHours,
	addMinutes,
	addMonths,
	addWeeks,
	format,
	formatDistanceToNow,
	isBefore,
	isSameYear,
	parseISO,
} from "date-fns";

import { ptBR } from "date-fns/locale";
import {
	CopyIcon,
	ExpandIcon,
	PencilLineIcon,
	ShrinkIcon,
	TimerIcon,
	TrashIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuPortal,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { CATEGORIES, INTENTS, PRIORITIES, STATES } from "~/lib/constants";
import {
	AvatarPartner,
	AvatarPerson,
	Icons,
	getResponsibles,
} from "~/lib/helpers";
import { cn } from "~/lib/utils";
import { Toggle } from "../ui/toggle";

export function ActionLine({
	action,
	categories,
	states,
	priorities,
	showCategory,
	partner,
	date,
	onDrag,
}: {
	action: Action;
	categories: Category[];
	states: State[];
	priorities: Priority[];
	showCategory?: boolean;
	partner?: Partner;
	date?: { dateFormat?: 0 | 1 | 2 | 3 | 4; timeFormat?: 0 | 1 };
	onDrag?: (action: Action) => void;
}) {
	const [edit, setEdit] = useState(false);
	const [isHover, setHover] = useState(false);
	const navigate = useNavigate();
	const submit = useSubmit();
	const state = states.find((state) => state.id === action.state_id);

	const matches = useMatches();
	const { people } = matches[1].data as DashboardDataType;

	const inputRef = useRef<HTMLInputElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

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

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					title={action.title}
					className={`group/action relative flex w-full select-none items-center gap-2 rounded border-l-4 px-2 py-1 text-sm font-medium shadow outline-none ring-primary transition focus-within:ring-2 focus:ring-2  md:text-xs ${
						edit
							? "text-white"
							: "cursor-text bg-gray-900 hover:bg-gray-800 hover:text-gray-200"
					} border-${state?.slug}`}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						if (e.shiftKey && !edit) {
							navigate(`/dashboard/action/${action.id}`);
						} else {
							setEdit(true);
						}
					}}
					onMouseEnter={() => {
						setHover(true);
					}}
					onMouseLeave={() => {
						setHover(false);
					}}
					role="button"
					tabIndex={0}
					onKeyDown={() => {}}
					draggable={!!onDrag}
					onDragEnd={() => {
						if (onDrag) onDrag(action);
					}}
				>
					{/* Atalhos */}
					{isHover && !edit ? (
						<ShortcutActions action={action} />
					) : null}

					{partner && (
						<AvatarPartner
							size="xs"
							partner={partner}
							className=""
						/>
					)}
					{showCategory && (
						<Icons
							id={
								categories.find(
									(category) =>
										category.id === action.category_id
								)?.slug
							}
							className="size-3 shrink-0 opacity-25"
						/>
					)}

					<div className="relative w-full shrink overflow-hidden">
						{edit ? (
							<input
								ref={inputRef}
								type="text"
								name="title"
								defaultValue={action.title}
								className="w-full bg-transparent outline-none"
								onKeyDown={(event) => {
									if (event.key === "Escape") {
										flushSync(() => {
											setEdit(() => false);
										});
										buttonRef.current?.focus();
									} else if (event.key === "Enter") {
										event.preventDefault();
										if (
											inputRef.current?.value !==
											action.title
										) {
											flushSync(() => {
												handleActions({
													intent: INTENTS.updateAction,
													...action,
													title: String(
														inputRef.current?.value
													),
												});
											});

											buttonRef.current?.focus();
										}
										setEdit(() => false);
									}
								}}
								onBlur={(event) => {
									event.preventDefault();
									if (
										inputRef.current?.value !== action.title
									) {
										flushSync(() => {
											handleActions({
												intent: INTENTS.updateAction,
												...action,
												title: String(
													inputRef.current?.value
												),
											});
										});
									}
									setEdit(() => false);
								}}
							/>
						) : (
							<button
								ref={buttonRef}
								className={`block w-full cursor-text overflow-hidden text-ellipsis text-nowrap text-left outline-none`}
								onClick={() => {
									flushSync(() => {
										setEdit(true);
									});
									inputRef.current?.select();
								}}
							>
								{action.title}
							</button>
						)}
					</div>

					<div className="flex">
						{getResponsibles(people, action.responsibles).map(
							(person) => (
								<AvatarPerson
									person={person}
									size="xs"
									key={person.id}
									group
								/>
							)
						)}
					</div>

					{date && (
						<div className=" shrink grow-0 whitespace-nowrap text-right text-xs opacity-25 md:text-[10px]">
							{formatActionDatetime({
								date: action.date,
								dateFormat: date.dateFormat,
								timeFormat: date.timeFormat,
							})}
						</div>
					)}
					<div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gray-500 opacity-0 transition group-hover/action:opacity-100"></div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuItems action={action} handleActions={handleActions} />
		</ContextMenu>
	);
}

export function ActionBlock({ action }: { action: Action }) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const submit = useSubmit();
	const [edit, setEdit] = useState(false);
	const [isHover, setHover] = useState(false);

	const matches = useMatches();
	const { categories, states, partners, people } = matches[1]
		.data as DashboardDataType;
	const partner = partners.find(
		(partner) => partner.id === action.partner_id
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
			}
		);
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					title={action.title}
					className={`group/action relative flex w-full flex-col justify-between gap-2 overflow-hidden rounded focus-within:ring-2 ring-primary border-l-4 px-4 py-2 text-sm transition ring-offset-2 ring-offset-background @container border-${
						states.find((state) => state.id === action.state_id)
							?.slug
					} ${
						edit
							? "bg-gray-800 text-gray-200"
							: "border-white/20 bg-gray-900 hover:bg-gradient-to-b from-gray-800  hover:text-gray-100"
					}`}
					onMouseEnter={() => {
						setHover(true);
					}}
					onMouseLeave={() => {
						setHover(false);
					}}
				>
					{isHover && !edit ? (
						<ShortcutActions action={action} />
					) : null}
					{/* Title */}
					<div className="relative font-semibold text-lg leading-tighter">
						{edit ? (
							<Form
								method="POST"
								onSubmit={(event) => {
									event.preventDefault();
									flushSync(() => {
										setEdit(false);
										if (
											inputRef.current?.value !==
												undefined &&
											inputRef.current?.value !==
												action.title
										) {
											handleActions({
												intent: INTENTS.updateAction,
												...action,
												title: inputRef.current?.value,
											});
										}
									});
									buttonRef.current?.focus();
								}}
							>
								<input
									ref={inputRef}
									type="text"
									defaultValue={action.title}
									className={`w-full overflow-hidden bg-transparent outline-none`}
									onBlur={() => {
										if (
											inputRef.current?.value !==
												undefined &&
											inputRef.current?.value !==
												action.title
										)
											handleActions({
												intent: INTENTS.updateAction,
												...action,
												title: inputRef.current?.value,
											});

										setEdit(() => false);
									}}
								/>
							</Form>
						) : (
							<button
								ref={buttonRef}
								className={`block w-full overflow-hidden text-ellipsis text-nowrap text-left outline-none`}
								onClick={() => {
									flushSync(() => {
										setEdit(true);
									});
									inputRef.current?.focus();
								}}
							>
								{action.title}
							</button>
						)}
					</div>
					<div className="flex items-center justify-between text-gray-400">
						<div className="flex items-center gap-2">
							{/* Cliente */}
							{partner ? (
								<AvatarPartner partner={partner} />
							) : null}
							{/* Category - Categoria */}
							<div>
								<Icons
									id={
										categories.find(
											(category) =>
												category.id ===
												action.category_id
										)?.slug
									}
									className="w-4"
								/>
							</div>
							{/* Priority - Prioridade */}
							{action.priority_id === PRIORITIES.high ? (
								<div>
									<Icons
										id={"high"}
										className="w-4"
										type="priority"
									/>
								</div>
							) : null}
							{/* Responsibles -  Responsáveis */}
							<div className="flex">
								{getResponsibles(
									people,
									action.responsibles
								).map((person) => (
									<AvatarPerson
										person={person}
										size="sm"
										key={person.id}
										group
									/>
								))}
							</div>
						</div>
						<div className="whitespace-nowrap font-medium text-right text-sm text-gray-500 md:text-xs">
							<span className="@[200px]:hidden">
								{formatActionDatetime({
									date: action.date,
									dateFormat: 2,
									timeFormat: 1,
								})}
							</span>
							<span className="hidden @[200px]:block @[300px]:hidden">
								{formatActionDatetime({
									date: action.date,
									dateFormat: 3,
									timeFormat: 1,
								})}
							</span>
							<span className="hidden @[300px]:block">
								{formatActionDatetime({
									date: action.date,
									dateFormat: 4,
									timeFormat: 1,
								})}
							</span>
						</div>
					</div>
					<div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gray-400 opacity-0 transition group-hover/action:opacity-100"></div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuItems action={action} handleActions={handleActions} />
		</ContextMenu>
	);
}

export function ActionGrid({
	action,
	states,
	categories,
	priorities,
	classNames,
}: {
	action: Action;
	states: State[];
	categories: Category[];
	priorities: Priority[];
	classNames?: string;
}) {
	const [isHover, setHover] = useState(false);
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

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={`group/action relative flex aspect-square select-none flex-col items-center justify-between rounded from-white/5 p-2 text-gray-500 hover:bg-gradient-to-b ${cn(
						classNames
					)} ${
						action.state_id === STATES.finish
							? " bg-gray-900/50 "
							: "highlight-soft bg-gray-800"
					}`}
					onMouseEnter={() => setHover(true)}
					onMouseLeave={() => setHover(false)}
				>
					{isHover ? <ShortcutActions action={action} /> : null}
					<div></div>
					<div
						className={`line-clamp-2 py-4 text-gray-400 text-center transition group-hover/action:text-gray-300 font-bold tracking-tighter leading-none overflow-hidden`}
					>
						{action.title}
					</div>
					<div className="flex items-center justify-center gap-2 leading-none">
						<div
							className={`h-2 w-2 rounded-full bg-${
								states.find(
									(state) => state.id === action.state_id
								)?.slug
							}`}
						></div>

						<div className="text-[10px] text-gray-400">
							{format(parseISO(action.date), "E, d 'de' MMM", {
								locale: ptBR,
							})}
						</div>
					</div>
					<div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gray-400 opacity-0 transition group-hover/action:opacity-100"></div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuItems action={action} handleActions={handleActions} />
		</ContextMenu>
	);
}

export function ListOfActions({
	actions,
	categories,
	states,
	priorities,
	partners,
	showCategory,
	date,
	columns = 1,
	onDrag,
	isFoldable,
}: {
	actions?: Action[] | null;
	categories: Category[];
	states: State[];
	priorities: Priority[];
	partners?: Partner[];
	showCategory?: boolean;
	date?: { dateFormat?: 0 | 1 | 2 | 3 | 4; timeFormat?: 0 | 1 };
	columns?: 1 | 2 | 3 | 6;
	onDrag?: (action: Action) => void;
	isFoldable?: boolean;
}) {
	const foldCount = columns * 4;
	const [fold, setFold] = useState(isFoldable ? foldCount : undefined);
	return actions && actions.length > 0 ? (
		<>
			<div
				className={`min-h-full ${
					columns === 1
						? "flex flex-col"
						: columns === 2
						? "grid sm:grid-cols-2"
						: columns === 3
						? "grid sm:grid-cols-2 md:grid-cols-3"
						: "grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4  2xl:grid-cols-6"
				} gap-x-4 gap-y-1 @container`}
			>
				{actions?.slice(0, fold).map((action) => (
					<ActionLine
						key={action.id}
						action={action}
						categories={categories}
						states={states}
						priorities={priorities}
						showCategory={showCategory}
						partner={
							partners
								? partners.find(
										(partner) =>
											partner.id === action.partner_id
								  )
								: undefined
						}
						date={date}
						onDrag={onDrag}
					/>
				))}
			</div>
			{actions && isFoldable && actions.length > foldCount ? (
				<div className="p-4 text-center">
					<Toggle
						size={"sm"}
						onChange={(isPressed) => {
							setFold(isPressed ? undefined : foldCount);
						}}
					>
						{fold ? (
							<>
								<span>Exibir todos</span>
								<ExpandIcon className="size-4" />
							</>
						) : (
							<>
								<span>Exibir menos</span>
								<ShrinkIcon className="size-4" />
							</>
						)}
					</Toggle>
				</div>
			) : null}
		</>
	) : null;
}

export function BlockOfActions({
	actions,
	max,
}: {
	actions?: Action[] | null;
	max?: 1 | 2;
}) {
	return (
		<div
			className={`grid ${
				!max
					? "sm:grid-cols-3 md:grid-cols-4"
					: max === 2
					? "grid-cols-2"
					: ""
			} gap-2`}
		>
			{actions?.map((action) => (
				<ActionBlock action={action} key={action.id} />
			))}
		</div>
	);
}

export function GridOfActions({
	actions,
	categories,
	states,
	priorities,
}: {
	actions?: Action[];
	categories: Category[];
	states: State[];
	priorities: Priority[];
}) {
	return (
		<div className="scrollbars">
			<div className="grid h-full grid-cols-3 place-content-start gap-1">
				{actions?.map((action, index) => (
					<ActionGrid
						action={action}
						categories={categories}
						states={states}
						key={action.id}
						priorities={priorities}
						classNames={
							index === 0
								? "rounded-tl-xl"
								: index === 2
								? "rounded-tr-xl"
								: ""
						}
					/>
				))}
			</div>
		</div>
	);
}

function ShortcutActions({ action }: { action: Action }) {
	const navigate = useNavigate();
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

	useEffect(() => {
		const keyDown = async function (event: KeyboardEvent) {
			const key = event.key.toLowerCase();
			const code = event.code;

			if (
				["i", "f", "z", "a", "t", "c"].find((k) => k === key) &&
				!event.shiftKey
			) {
				let state_id = STATES.do;
				if (key === "i") {
					state_id = STATES.ideia;
				}
				if (key === "f") {
					state_id = STATES.do;
				}
				if (key === "z") {
					state_id = STATES.doing;
				}
				if (key === "a") {
					state_id = STATES.review;
				}
				if (key === "t") {
					state_id = STATES.done;
				}
				if (key === "c") {
					state_id = STATES.finish;
				}

				handleActions({
					intent: INTENTS.updateAction,
					...action,
					state_id,
				});
			}
			if (
				[
					"KeyT",
					"KeyP",
					"KeyV",
					"KeyS",
					"KeyC",
					"KeyI",
					"KeyR",
					"KeyF",
					"KeyD",
					"KeyA",
				].find((k) => k === code) &&
				event.altKey
			) {
				let category_id = CATEGORIES.post;
				if (code === "KeyT") {
					category_id = CATEGORIES.todo;
				}
				if (code === "KeyP") {
					category_id = CATEGORIES.post;
				}
				if (code === "KeyV") {
					category_id = CATEGORIES.video;
				}
				if (code === "KeyS") {
					category_id = CATEGORIES.stories;
				}
				if (code === "KeyC") {
					category_id = CATEGORIES.dev;
				}
				if (code === "KeyI") {
					category_id = CATEGORIES.print;
				}
				if (code === "KeyR") {
					category_id = CATEGORIES.meeting;
				}
				if (code === "KeyF") {
					category_id = CATEGORIES.finance;
				}
				if (code === "KeyD") {
					category_id = CATEGORIES.design;
				}
				if (code === "KeyA") {
					category_id = CATEGORIES.ads;
				}

				handleActions({
					intent: INTENTS.updateAction,
					...action,
					category_id,
				});
			} else if (key === "e" && event.shiftKey) {
				navigate(`/dashboard/action/${action.id}`);
			} else if (key === "d" && event.shiftKey) {
				handleActions({
					...action,
					newId: window.crypto.randomUUID(),
					created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
					updated_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
					intent: INTENTS.duplicateAction,
				});
			} else if (key === "x" && event.shiftKey) {
				handleActions({ ...action, intent: INTENTS.deleteAction });
			} else if (key === ",") {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					priority_id: PRIORITIES.low,
				});
			} else if (key === ".") {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					priority_id: PRIORITIES.medium,
				});
			} else if (key === "/") {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					priority_id: PRIORITIES.high,
				});
			}
			//em uma hora
			else if (code === "Digit1" && event.shiftKey) {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					date: format(
						isBefore(action.date, new Date())
							? addHours(new Date(), 1)
							: addHours(action.date, 1),
						"yyyy-MM-dd'T'HH:mm:ss"
					),
				});
			}
			//em duas horas
			else if (code === "Digit2" && event.shiftKey) {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					date: format(
						isBefore(action.date, new Date())
							? addHours(new Date(), 2)
							: addHours(action.date, 2),
						"yyyy-MM-dd'T'HH:mm:ss"
					),
				});
			}
			//em três horas
			else if (code === "Digit3" && event.shiftKey) {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					date: format(
						isBefore(action.date, new Date())
							? addHours(new Date(), 3)
							: addHours(action.date, 3),
						"yyyy-MM-dd'T'HH:mm:ss"
					),
				});
			}
			//Hoje
			else if (key === "h" && event.shiftKey) {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					date: format(
						addMinutes(new Date(), 30),
						"yyyy-MM-dd'T'HH:mm:ss"
					),
				});
			}
			// Amanhã
			else if (key === "a" && event.shiftKey) {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					date: format(
						addDays(new Date(), 1),
						"yyyy-MM-dd'T'HH:mm:ss"
					),
				});
			}

			// Adiciona uma semana
			else if (key === "s" && event.shiftKey) {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					date: format(
						isBefore(action.date, new Date())
							? addWeeks(new Date(), 1)
							: addWeeks(action.date, 1),
						"yyyy-MM-dd'T'HH:mm:ss"
					),
				});
			}
			// Adiciona um mês
			else if (key === "m" && event.shiftKey) {
				handleActions({
					...action,
					intent: INTENTS.updateAction,
					date: format(
						isBefore(action.date, new Date())
							? addMonths(new Date(), 1)
							: addMonths(action.date, 1),
						"yyyy-MM-dd'T'HH:mm:ss"
					),
				});
			}
		};
		window.addEventListener("keydown", keyDown);

		return () => window.removeEventListener("keydown", keyDown);
	}, [action, navigate]);

	return <></>;
}

export function formatActionDatetime({
	date,
	dateFormat,
	timeFormat,
}: {
	date: Date | string;
	dateFormat?: 0 | 1 | 2 | 3 | 4;
	timeFormat?: 0 | 1;
}) {
	// 0 - Sem informação de data
	// 1 - Distância
	// 2 - Curta
	// 3 - Média
	// 4 - Longa

	// 0 - Sem informação de horas
	// 1 - Com horas

	date = typeof date === "string" ? parseISO(date) : date;
	const formatString = (
		dateFormat === 2
			? `d/M${
					!isSameYear(date.getFullYear(), new Date().getUTCFullYear())
						? "/yy"
						: ""
			  }`
			: dateFormat === 3
			? `d 'de' MMM${
					!isSameYear(date.getFullYear(), new Date().getUTCFullYear())
						? " 'de' yy"
						: ""
			  }`
			: dateFormat === 4
			? `E, d 'de' MMMM${
					!isSameYear(date.getFullYear(), new Date().getUTCFullYear())
						? " 'de' yyy"
						: ""
			  }`
			: ""
	).concat(
		timeFormat
			? `${dateFormat ? " 'às' " : ""}H'h'${
					date.getMinutes() > 0 ? "m" : ""
			  }`
			: ""
	);

	return dateFormat === 1
		? formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
		: format(date, formatString, { locale: ptBR });
}

function ContextMenuItems({
	action,
	handleActions,
}: {
	action: Action;
	handleActions: (data: {
		[key: string]: string | number | null | string[];
	}) => void;
}) {
	const matches = useMatches();
	const { people, states, categories, priorities } = matches[1]
		.data as DashboardDataType;

	return (
		<ContextMenuContent className="bg-content">
			<ContextMenuItem asChild>
				<Link
					className="bg-item flex items-center gap-2"
					to={`/dashboard/action/${action.id}`}
				>
					<PencilLineIcon className="size-3" />
					<span>Editar</span>
				</Link>
			</ContextMenuItem>
			<ContextMenuItem className="bg-item flex items-center gap-2">
				<CopyIcon className="size-3" />
				<span>Duplicar</span>
			</ContextMenuItem>
			{/* Adiar */}
			<ContextMenuSub>
				<ContextMenuSubTrigger className="bg-item flex items-center gap-2">
					<TimerIcon className="size-3" />
					<span>Adiar</span>
				</ContextMenuSubTrigger>
				<ContextMenuPortal>
					<ContextMenuSubContent className="bg-content">
						{[
							{
								periods: [
									{
										time: addHours(new Date(), 1),
										text: "daqui a 1 hora",
									},
									{
										time: addHours(new Date(), 3),
										text: "daqui a 3 horas",
									},
									{
										time: addHours(new Date(), 8),
										text: "daqui a 8 horas",
									},
								],
							},
							{
								periods: [
									{
										time: parseISO(action.date).setDate(
											addDays(new Date(), 1).getDate()
										),
										text: "Amanhã",
									},
									{
										time: parseISO(action.date).setDate(
											addDays(new Date(), 3).getDate()
										),
										text: "3 dias",
									},
								],
							},
							{
								periods: [
									{
										time: parseISO(action.date).setDate(
											addDays(new Date(), 7).getDate()
										),
										text: "1 semana",
									},
									{
										time: parseISO(action.date).setMonth(
											addMonths(new Date(), 1).getMonth()
										),
										text: "1 mês",
									},
								],
							},
						].map((group, i) => (
							<Fragment key={i}>
								{i > 0 && (
									<ContextMenuSeparator
										key={`separator-${i}`}
										className="bg-gray-300/20"
									/>
								)}

								{group.periods.map((period) => (
									<ContextMenuItem
										key={`period-${period.time}`}
										className="bg-item flex items-center gap-2"
										onSelect={() => {
											const date = format(
												period.time,
												"yyyy-MM-dd'T'HH:mm:ss"
											);

											handleActions({
												intent: INTENTS.updateAction,
												...action,
												date,
											});
										}}
									>
										{period.text}
									</ContextMenuItem>
								))}
							</Fragment>
						))}
					</ContextMenuSubContent>
				</ContextMenuPortal>
			</ContextMenuSub>
			{/* Deletar */}
			<ContextMenuItem className="bg-item flex items-center gap-2">
				<TrashIcon className="size-3" />
				<span>Deletar</span>
			</ContextMenuItem>
			<ContextMenuSeparator className="bg-gray-300/20 " />
			{/* States */}
			<ContextMenuSub>
				<ContextMenuSubTrigger className="bg-item flex items-center gap-2">
					<div
						className={`size-3 rounded-full border-2 border-${
							states.find((state) => state.id === action.state_id)
								?.slug
						}`}
					></div>
					<span>
						{
							states.find((state) => state.id === action.state_id)
								?.title
						}
					</span>
				</ContextMenuSubTrigger>
				<ContextMenuPortal>
					<ContextMenuSubContent className="bg-content">
						{states.map((state) => (
							<ContextMenuItem
								key={state.id}
								className="bg-item flex items-center gap-2"
								onSelect={() => {
									handleActions({
										...action,
										state_id: state.id,
										intent: INTENTS.updateAction,
									});
								}}
							>
								<div
									className={`size-3 rounded-full border-2 border-${state?.slug}`}
								></div>
								<span>{state.title}</span>
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuPortal>
			</ContextMenuSub>

			{/* Categoria */}
			<ContextMenuSub>
				<ContextMenuSubTrigger className="bg-item flex items-center gap-2">
					<Icons
						id={
							categories.find(
								(category) => category.id === action.category_id
							)?.slug
						}
						className="size-3"
					/>
					<span>
						{
							categories.find(
								(category) => category.id === action.category_id
							)?.title
						}
					</span>
				</ContextMenuSubTrigger>
				<ContextMenuPortal>
					<ContextMenuSubContent className="bg-content">
						{categories.map((category) => (
							<ContextMenuItem
								key={category.id}
								className="bg-item flex items-center gap-2"
								onSelect={() => {
									handleActions({
										...action,
										category_id: category.id,
										intent: INTENTS.updateAction,
									});
								}}
							>
								<Icons id={category.slug} className="size-3" />
								{category.title}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuPortal>
			</ContextMenuSub>
			{/* Responsibles - Responsáveis  */}
			<ContextMenuSub>
				<ContextMenuSubTrigger className="bg-item">
					<div className="flex items-center">
						{getResponsibles(people, action.responsibles).map(
							(person) => (
								<AvatarPerson
									person={person}
									size="sm"
									key={person.id}
									group
								/>
							)
						)}
					</div>
				</ContextMenuSubTrigger>
				<ContextMenuPortal>
					<ContextMenuSubContent className="bg-content">
						{people.map((person) => (
							<ContextMenuCheckboxItem
								checked={
									action.responsibles?.find(
										(user_id) => user_id === person.user_id
									)
										? true
										: false
								}
								key={person.id}
								className="bg-select-item flex items-center gap-2"
								onCheckedChange={(e) => {
									let r = action.responsibles || [person.id];
									flushSync(() => {
										if (e) {
											r = action.responsibles
												? [
														...action.responsibles,
														person.user_id,
												  ]
												: [person.user_id];
										} else {
											r = action.responsibles
												? action.responsibles.filter(
														(user_id) =>
															user_id !==
															person.user_id
												  )
												: [person.user_id];
										}
									});

									handleActions({
										...action,
										responsibles: r.join(","),

										intent: INTENTS.updateAction,
									});
								}}
							>
								<AvatarPerson person={person} size="sm" />
								{`${person.name} ${person.surname}`}
							</ContextMenuCheckboxItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuPortal>
			</ContextMenuSub>
			{/* Prioridade */}
			<ContextMenuSub>
				<ContextMenuSubTrigger className="bg-item flex items-center gap-2">
					<Icons
						id={
							priorities.find(
								(priority) => priority.id === action.priority_id
							)?.slug
						}
						className="size-3"
						type="priority"
					/>
					<span>
						{
							priorities.find(
								(priority) => priority.id === action.priority_id
							)?.title
						}
					</span>
				</ContextMenuSubTrigger>
				<ContextMenuPortal>
					<ContextMenuSubContent className="bg-content">
						{priorities.map((priority) => (
							<ContextMenuItem
								key={priority.id}
								className="bg-item flex items-center gap-2"
								onSelect={() => {
									handleActions({
										...action,
										priority_id: priority.id,
										intent: INTENTS.updateAction,
									});
								}}
							>
								<Icons
									id={priority.slug}
									type="priority"
									className="size-3"
								/>
								{priority.title}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuPortal>
			</ContextMenuSub>
		</ContextMenuContent>
	);
}

// ${
// 	action.title.length > 30
// 		? "text-sm leading-tight"
// 		: action.title.length > 18 ||
// 			action.title.indexOf(" ") === -1
// 		? "text-lg leading-[1.15] tracking-tight"
// 		: "text-2xl leading-none tracking-tight"
// }
