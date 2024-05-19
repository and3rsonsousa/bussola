import { useFetchers } from "@remix-run/react";
import { isAfter, isBefore, isSameDay, parseISO } from "date-fns";
import {
	CircleDashedIcon,
	Code2Icon,
	ComponentIcon,
	DollarSignIcon,
	ImageIcon,
	ListChecksIcon,
	type LucideIcon,
	MegaphoneIcon,
	PenToolIcon,
	PlayIcon,
	PrinterIcon,
	SignalIcon,
	SignalLowIcon,
	SignalMediumIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { type CSSProperties } from "react";
import {
	Avatar as AvatarShad,
	AvatarFallback,
	AvatarImage,
} from "~/components/ui/avatar";
import { CATEGORIES, INTENTS, PRIORITIES, STATES } from "./constants";
import { cn } from "./utils";

export function ShortText({
	text,
	className,
}: {
	text: string;
	className?: string;
}) {
	const length = text.length;
	return (
		<div
			className={cn(
				`text-center text-[10px] font-extrabold uppercase leading-none tracking-wide`,
				className
			)}
			style={
				text.length > 4
					? { fontStretch: "100%" }
					: { fontStretch: "125%" }
			}
		>
			{length >= 4 ? (
				<>
					<div> {text.substring(0, Math.ceil(length / 2))} </div>
					<div> {text.substring(Math.ceil(length / 2))} </div>
				</>
			) : (
				<div>{text}</div>
			)}
		</div>
	);
}

export function Avatar({
	item,
	group,
	size = "sm",
	style,
	className,
}: {
	item: { image?: string | null; bg?: string; fg?: string; short: string };
	size?: "xs" | "sm" | "md" | "lg";
	style?: CSSProperties;
	className?: string;
	group?: boolean;
}) {
	return (
		<AvatarShad
			className={cn([
				size === "xs"
					? "h-4 w-4"
					: size === "sm"
					? "h-6 w-6"
					: size === "md"
					? "h-8 w-8"
					: "h-12 w-12",
				group ? "-ml-1" : "",
				"border",
				className,
			])}
			style={style}
		>
			{item.image ? (
				<AvatarImage src={item.image} />
			) : (
				<AvatarFallback
					style={{
						backgroundColor: item.bg || "#778",
						color: item.fg || "#dde",
					}}
				>
					<ShortText
						text={size === "xs" ? item.short[0] : item.short}
						className={
							size === "lg"
								? "scale-[1.3]"
								: size === "sm"
								? "scale-[0.6]"
								: size === "md"
								? "scale-[0.8]"
								: ""
						}
					/>
				</AvatarFallback>
			)}
		</AvatarShad>
	);
}

export function sortActions(
	actions?: Action[] | null,
	order: "asc" | "desc" = "asc"
) {
	return actions
		? actions
				.sort(
					(a, b) =>
						new Date(a.date).getTime() - new Date(b.date).getTime()
				)
				.sort((a, b) =>
					order === "desc"
						? Number(b.state_id) - Number(a.state_id)
						: Number(a.state_id) - Number(b.state_id)
				)
		: null;
}

export function getDelayedActions({
	actions,
	priority,
}: {
	actions: Action[];
	priority?: PRIORITIES;
}) {
	priority = priority
		? ({
				low: PRIORITIES.low,
				mid: PRIORITIES.medium,
				high: PRIORITIES.high,
		  }[priority] as PRIORITIES)
		: undefined;

	actions = actions
		? actions.filter(
				(action) =>
					isBefore(parseISO(action.date), new Date()) &&
					action.state_id !== STATES.finish &&
					(priority ? action.priority_id === priority : true)
		  )
		: [];

	return actions;
}

export function getNotFinishedActions({
	actions,
}: {
	actions?: Action[] | null;
}) {
	return actions
		? actions.filter(
				(action) =>
					isAfter(parseISO(action.date), new Date()) &&
					action.state_id !== STATES.finish
		  )
		: [];
}

export function getUrgentActions(actions: Action[] | null) {
	return actions
		? actions.filter(
				(action) =>
					action.priority_id === PRIORITIES.high &&
					action.state_id !== STATES.finish
		  )
		: [];
}

export function getActionsByPriority(actions: Action[] | null) {
	const la = actions
		? actions.filter(
				(action) =>
					action.priority_id === PRIORITIES.low &&
					action.state_id !== STATES.finish
		  )
		: [];
	const ma = actions
		? actions.filter(
				(action) =>
					action.priority_id === PRIORITIES.medium &&
					action.state_id !== STATES.finish
		  )
		: [];
	const ha = actions
		? actions.filter(
				(action) =>
					action.priority_id === PRIORITIES.high &&
					action.state_id !== STATES.finish
		  )
		: [];

	return [...la, ...ma, ...ha];
}

export function getActionsByState(actions: Action[]) {
	let _sorted: Action[][] = [];
	Object.entries(STATES).map(([, value]) => {
		_sorted.push(actions.filter((action) => action.state_id === value));
	});

	return _sorted.flat();
}

export function getActionsForThisDay({
	actions,
	date,
}: {
	actions?: Action[] | null;
	date?: Date | null;
}) {
	const currentDate = date || new Date();

	return actions
		? actions.filter((action) =>
				isSameDay(parseISO(action.date), currentDate)
		  )
		: [];
}

export function getInstagramActions({
	actions,
}: {
	actions?: Action[] | null;
}) {
	return actions
		? actions
				.filter((action) =>
					[CATEGORIES.post, CATEGORIES.video].includes(
						action.category_id
					)
				)
				.sort(
					(a, b) =>
						new Date(b.date).getTime() - new Date(a.date).getTime()
				)
		: [];
}

const iconsList: { [key: string]: LucideIcon } = {
	all: ComponentIcon,
	post: ImageIcon,
	video: PlayIcon,
	stories: CircleDashedIcon,
	todo: ListChecksIcon,
	finance: DollarSignIcon,
	print: PrinterIcon,
	meeting: UsersIcon,
	dev: Code2Icon,
	design: PenToolIcon,
	ads: MegaphoneIcon,
	low: SignalLowIcon,
	mid: SignalMediumIcon,
	high: SignalIcon,
	base: SignalIcon,
};

export const Icons = ({
	id,
	className,
	type = "category",
}: {
	id?: string;
	className?: string;
	type?: "category" | "priority";
}) => {
	const View = iconsList[id as string] ?? XIcon;

	return type === "category" ? (
		<View className={cn(className)} />
	) : (
		<div className="relative">
			<SignalIcon
				className={cn([
					"absolute left-0 top-0 z-0 opacity-20",
					className,
				])}
			/>
			<View
				className={cn([
					"isolate",
					id === "low"
						? "text-green-400"
						: id === "mid"
						? "text-amber-500"
						: "text-rose-600",
					className,
				])}
			/>
		</div>
	);
};

export function convertToAction(data: { [key: string]: unknown }): Action {
	const action: Action = {
		category_id: String(data["category_id"]),
		partner_id: String(data["partner_id"]),
		created_at: String(data["created_at"]),
		date: String(data["date"]),
		description: String(data["description"]),
		id: String(data["id"]),
		priority_id: String(data["priority_id"]),
		responsibles: String(data["responsibles"]).split(","),
		state_id: String(data["state_id"]),
		title: String(data["title"]),
		updated_at: String(data["updated_at"]),
		user_id: String(data["user_id"]),
	};
	return action;
}

export function useIDsToRemove() {
	return useFetchers()
		.filter((fetcher) => {
			if (!fetcher.formData) {
				return false;
			}
			return fetcher.formData.get("intent") === INTENTS.deleteAction;
		})
		.map((fetcher) => {
			return String(fetcher.formData?.get("id"));
		});
}
export function usePendingActions() {
	return useFetchers()
		.filter((fetcher) => {
			if (!fetcher.formData) {
				return false;
			}
			return (
				fetcher.formData.get("intent") === INTENTS.createAction ||
				fetcher.formData.get("intent") === INTENTS.updateAction
			);
		})
		.map((fetcher) => {
			const action: Action = {
				id: String(fetcher.formData?.get("id")),
				title: String(fetcher.formData?.get("title")),
				description: String(fetcher.formData?.get("description")),
				partner_id: String(fetcher.formData?.get("partner_id")),
				category_id: String(fetcher.formData?.get("category_id")),
				state_id: String(fetcher.formData?.get("state_id")),
				user_id: String(fetcher.formData?.get("user_id")),
				date: String(fetcher.formData?.get("date")),
				responsibles: String(
					fetcher.formData?.getAll("responsibles")
				).split(","),
				created_at: String(fetcher.formData?.get("created_at")),
				updated_at: String(fetcher.formData?.get("updated_at")),
				priority_id: String(fetcher.formData?.get("priority_id")),
			};

			return { ...action };
		});
}

export function getResponsibles(people: Person[], users_ids?: string[] | null) {
	return people.filter((person) =>
		users_ids?.find((user) => person.user_id === user)
	);
}

export function amIResponsible(responsibles: string[], user_id: string) {
	return responsibles.findIndex((id) => id === user_id) >= 0;
}
