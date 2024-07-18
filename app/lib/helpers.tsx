import { useFetchers } from "@remix-run/react";
import { format, isAfter, isBefore, isSameDay, parseISO } from "date-fns";
import {
  BadgeCheckIcon,
  CircleFadingPlusIcon,
  ClapperboardIcon,
  Code2Icon,
  ComponentIcon,
  DollarSignIcon,
  GalleryHorizontal,
  ImageIcon,
  ListChecksIcon,
  MegaphoneIcon,
  PenToolIcon,
  PrinterIcon,
  RouteIcon,
  SignalIcon,
  SignalLowIcon,
  SignalMediumIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { type CSSProperties } from "react";
import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarShad,
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
        className,
      )}
      style={
        text.length > 4 ? { fontStretch: "100%" } : { fontStretch: "125%" }
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
        group
          ? size === "md" || size === "lg"
            ? "-ml-2 border-2 border-background"
            : "-ml-1 border border-background"
          : "",
        "block",
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
            color: item.fg || "#bbc",
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
  order: "asc" | "desc" = "asc",
) {
  return actions
    ? actions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .sort((a, b) =>
          order === "desc"
            ? Number(b.state_id) - Number(a.state_id)
            : Number(a.state_id) - Number(b.state_id),
        )
    : null;
}

export function getDelayedActions({
  actions,
  priority,
}: {
  actions?: Action[] | null;
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
          (priority ? action.priority_id === priority : true),
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
          action.state_id !== STATES.finish,
      )
    : [];
}

export function getUrgentActions(actions: Action[] | null) {
  return actions
    ? actions.filter(
        (action) =>
          action.priority_id === PRIORITIES.high &&
          action.state_id !== STATES.finish,
      )
    : [];
}

export function getActionsByPriority(actions: Action[], descending?: boolean) {
  let _sorted: Action[][] = [];

  Object.entries(PRIORITIES).map(([, value]) => {
    _sorted.push(actions.filter((action) => action.priority_id === value));
  });

  return descending ? _sorted.flat().reverse() : _sorted.flat();
}

export function getActionsByState(actions: Action[], descending?: boolean) {
  let _sorted: Action[][] = [];
  Object.entries(STATES).map(([, value]) => {
    _sorted.push(actions.filter((action) => action.state_id === value));
  });

  return descending ? _sorted.flat().reverse() : _sorted.flat();
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
    ? actions.filter((action) => isSameDay(parseISO(action.date), currentDate))
    : [];
}

export const InstagramFeedContent = [
  CATEGORIES.post,
  CATEGORIES.reels,
  CATEGORIES.carousel,
];

export function getInstagramActions({
  actions,
}: {
  actions?: Action[] | null;
}) {
  return actions
    ? actions
        .filter((action) => InstagramFeedContent.includes(action.category_id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
}

const iconsList: { [key: string]: LucideIcon } = {
  all: ComponentIcon,
  //Category
  todo: ListChecksIcon,
  post: ImageIcon,
  carousel: GalleryHorizontal,
  reels: ClapperboardIcon,
  stories: CircleFadingPlusIcon,
  sm: BadgeCheckIcon,
  meeting: UsersIcon,
  ads: MegaphoneIcon,
  plan: RouteIcon,
  finance: DollarSignIcon,
  design: PenToolIcon,
  print: PrinterIcon,
  dev: Code2Icon,
  //Priority
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
  const View = iconsList[id as string] ?? ComponentIcon;

  return type === "category" ? (
    <View className={cn(className)} />
  ) : (
    <div className="relative">
      <SignalIcon
        className={cn(["absolute left-0 top-0 z-0 opacity-30", className])}
      />
      <View
        className={cn([
          "isolate",
          id === "low"
            ? "text-success-500"
            : id === "mid"
              ? "text-alert-500"
              : "text-error-600",
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
    date_to_post: String(data["date_to_post"]),
    files: String(data["files"]).split(","),
    caption: String(data["caption"]),
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
        responsibles: String(fetcher.formData?.getAll("responsibles")).split(
          ",",
        ),
        created_at: String(fetcher.formData?.get("created_at")),
        updated_at: String(fetcher.formData?.get("updated_at")),
        priority_id: String(fetcher.formData?.get("priority_id")),
        date_to_post: String(fetcher.formData?.get("date_to_post")),
        caption: String(fetcher.formData?.get("caption")),
        files: [],
      };

      return { ...action };
    });
}

export function getResponsibles(people: Person[], users_ids?: string[] | null) {
  return people.filter((person) =>
    users_ids?.find((user) => person.user_id === user),
  );
}

export function amIResponsible(responsibles: string[], user_id: string) {
  return responsibles.findIndex((id) => id === user_id) >= 0;
}

export function getActionNewDate(date: Date) {
  return format(
    (() => {
      if (new Date().getHours() > 11) {
        date.setHours(new Date().getHours() + 1, new Date().getMinutes());
      } else {
        date.setHours(11, 0);
      }
      return date;
    })(),
    "yyyy-MM-dd HH:mm:ss",
  );
}
export function getCleanAction({
  category_id,
  partner_id,
  date,
  title,
  description,
  priority_id,
  responsibles,
  user_id,
  state_id,
  created_at,
  date_to_post,
  files,
  id,
  updated_at,
}: {
  category_id?: string;
  partner_id?: string;
  date?: Date;
  title?: string;
  description?: string;
  priority_id?: string;
  responsibles: string[];
  user_id: string;
  state_id?: string;
  created_at?: string;
  date_to_post?: string;
  files?: string[];
  id?: string;
  updated_at?: string;
}) {
  return {
    category_id: category_id || CATEGORIES.post,
    partner_id: partner_id || null,
    date: date ? getActionNewDate(date) : getActionNewDate(new Date()),
    title: title || "",
    description: description || "",
    priority_id: priority_id || PRIORITIES.medium,
    responsibles,
    user_id,
    state_id: state_id || STATES.ideia,
    created_at: created_at || "",
    date_to_post: date_to_post || "",
    files: files || null,
    id: id || "",
    updated_at: updated_at || "",
  };
}
