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
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
	FINISHED_ID,
	INTENTS,
	POST_ID,
	PRIORITIES,
	VIDEO_ID,
} from "./constants";
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
				`text-center font-bold uppercase leading-none tracking-wide`,
				className
			)}
		>
			{length > 4 ? (
				<div className="scale-[0.65]">
					<div> {text.substring(0, Math.ceil(length / 2))} </div>
					<div> {text.substring(Math.ceil(length / 2))} </div>
				</div>
			) : length === 4 ? (
				<div className="scale-[0.75]">
					<div> {text.substring(0, Math.ceil(length / 2))} </div>
					<div> {text.substring(Math.ceil(length / 2))} </div>
				</div>
			) : (
				<div className="scale-[0.75]">{text}</div>
			)}
		</div>
	);
}

export function AvatarClient({
	client,
	size = "sm",
	style,
	className,
}: {
	client: Client;
	size?: "xs" | "sm" | "md" | "lg";
	style?: CSSProperties;
	className?: string;
}) {
	return (
		<Avatar
			className={cn([
				size === "xs"
					? "h-4 w-4"
					: size === "sm"
					? "h-6 w-6"
					: size === "md"
					? "h-8 w-8"
					: "h-12 w-12",
				className,
			])}
			style={style}
		>
			<AvatarFallback
				style={{
					backgroundColor: client.bgColor || "#999",
					color: client.fgColor || "#333",
				}}
			>
				<ShortText
					text={size === "xs" ? client.short[0] : client.short}
					className={
						size === "sm"
							? "scale-[0.7]"
							: size === "md"
							? "scale-[0.8]"
							: "scale-[1.3]"
					}
				/>
			</AvatarFallback>
		</Avatar>
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
					Number(action.state_id) !== FINISHED_ID &&
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
					action.state_id !== FINISHED_ID
		  )
		: [];
}

export function getUrgentActions(actions: Action[] | null) {
	return actions
		? actions.filter(
				(action) =>
					action.priority_id === PRIORITIES.high &&
					action.state_id !== FINISHED_ID
		  )
		: [];
}

export function getActionsForThisDay({
	actions,
	date,
}: {
	actions?: Action[] | null;
	date?: Date;
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
					[POST_ID, VIDEO_ID].includes(Number(action.category_id))
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
		category_id: Number(data["category_id"]),
		client_id: Number(data["client_id"]),
		created_at: String(data["created_at"]),
		date: String(data["date"]),
		description: String(data["description"]),
		id: String(data["id"]),
		priority_id: String(data["priority_id"]),
		responsibles: String(data["responsibles"]).split(","),
		state_id: Number(data["state_id"]),
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
				client_id: Number(fetcher.formData?.get("client_id")),
				category_id: Number(fetcher.formData?.get("category_id")),
				state_id: Number(fetcher.formData?.get("state_id")),
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
