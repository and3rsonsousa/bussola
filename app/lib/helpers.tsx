import { Link, useFetchers, useMatches } from "@remix-run/react";
import clsx from "clsx";
// @ts-ignore
import Color from "color";
import {
  endOfDay,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BadgeCheckIcon,
  CameraIcon,
  CircleFadingPlusIcon,
  ClapperboardIcon,
  ClipboardCheckIcon,
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
import { useState, type CSSProperties } from "react";
import { DateRange } from "react-day-picker";
import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarShad,
} from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { BASE_COLOR, INTENTS, PRIORITIES } from "./constants";
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
        `text-center text-[10px] font-bold uppercase leading-none tracking-wide`,
        className,
      )}
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

export function AvatarGroup({
  avatars,
  size = "sm",
}: {
  avatars: {
    item: { image?: string | null; bg?: string; fg?: string; short: string };

    style?: CSSProperties;
    className?: string;
  }[];
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  return (
    <div
      className={`flex ${["xs", "sm"].find((s) => s === size) ? "-space-x-1" : ["md", "lg"].find((s) => s === size) ? "-space-x-2" : "-space-x-4"}`}
    >
      {avatars.map(({ item, className, style }, i) => (
        <Avatar
          key={i}
          item={item}
          className={className}
          group
          size={size}
          style={style}
        />
      ))}
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
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  style?: CSSProperties;
  className?: string;
  group?: boolean;
}) {
  return (
    <AvatarShad
      tabIndex={-1}
      className={cn([
        size === "xs"
          ? "size-4"
          : size === "sm"
            ? "size-6"
            : size === "md"
              ? "size-8"
              : size === "lg"
                ? "size-12"
                : "size-16",
        group
          ? size === "xl"
            ? "border-2 border-background"
            : size === "md" || size === "lg"
              ? "border-2 border-background"
              : "border border-background"
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
              size === "xl"
                ? "scale-[1.6]"
                : size === "lg"
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
            ? Number(b.state) - Number(a.state)
            : Number(a.state) - Number(b.state),
        )
    : null;
}

export function getDelayedActions({
  actions,
  priority,
}: {
  actions?: Action[] | ActionChart[] | null;
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
          action.state !== "finished" &&
          (priority && "priority" in action
            ? action.priority === priority
            : true),
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
          action.state !== "finished",
      )
    : [];
}

export function getUrgentActions(actions: Action[] | null) {
  return actions
    ? actions.filter(
        (action) =>
          action.priority === PRIORITIES.high && action.state !== "finished",
      )
    : [];
}

export function getActionsByPriority(actions: Action[], descending?: boolean) {
  let _sorted: Action[][] = [];

  Object.entries(PRIORITIES).map(([, value]) => {
    _sorted.push(actions.filter((action) => action.priority === value));
  });

  return descending ? _sorted.reverse().flat() : _sorted.flat();
}

export function getActionsByState(
  actions: Action[],
  states: State[],
  descending?: boolean,
) {
  let _sorted: Action[][] = [];
  Object.entries(states).map(([, value]) => {
    _sorted.push(actions.filter((action) => action.state === value.slug));
  });

  return descending ? _sorted.reverse().flat() : _sorted.flat();
}

export function getActionsByTime(actions: Action[], descending?: boolean) {
  let _sorted = actions.sort((a, b) => (isBefore(a.date, b.date) ? -1 : 1));

  return descending ? _sorted.reverse() : _sorted;
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

export function getInstagramFeed({
  actions,
}: {
  actions?: Action[] | RawAction[] | null;
}) {
  return actions
    ? actions
        .filter((action) => isInstagramFeed(action.category))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
}

const iconsList: { [key: string]: LucideIcon } = {
  all: ComponentIcon,
  //Category
  capture: CameraIcon,
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
        user_id: String(fetcher.formData?.get("user_id")),
        date: String(fetcher.formData?.get("date")),
        instagram_date: String(fetcher.formData?.get("date")),
        responsibles: String(fetcher.formData?.getAll("responsibles")).split(
          ",",
        ),
        time: Number(fetcher.formData?.get("time")),
        created_at: String(fetcher.formData?.get("created_at")),
        updated_at: String(fetcher.formData?.get("updated_at")),
        partner: String(fetcher.formData?.get("partner")),
        category: String(fetcher.formData?.get("category")),
        state: String(fetcher.formData?.get("state")),
        priority: String(fetcher.formData?.get("priority")),
        caption: String(fetcher.formData?.get("caption")),
        color: String(fetcher.formData?.get("color")),
        files: String(fetcher.formData?.get("files")).split(","),
        archived: Boolean(fetcher.formData?.get("archived")),
      };

      return { ...action };
    });
}

export function getResponsibles(users_ids?: string[] | null) {
  const matches = useMatches();
  const { people } = matches[1].data as DashboardRootType;

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

export function Bussola({
  size = "sm",
  short,
  className,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  short?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(``, className)}>
      {short ? (
        <svg
          viewBox="0 0 465 506"
          style={{
            fillRule: "evenodd",
            clipRule: "evenodd",
            strokeLinejoin: "round",
            strokeMiterlimit: 2,
          }}
          fill="currentColor"
          className={` ${{ xs: "h-4 min-h-4", sm: "h-6 min-h-6", md: "h-8 min-h-8", lg: "h-12 min-h-12" }[size]} `}
        >
          <path
            d="M840.47-1417.51h83.317l27.015-464.89H840.47z"
            transform="matrix(0 -1 -1 0 -1417.51 950.81)"
          />
          <path
            d="M885.979-1081.47c137.931 0 241.551-73.51 241.551-221.24v-104.26H983.999v99.36c0 74.91-31.506 110.62-91.718 110.62-57.412 0-89.618-37.11-89.618-110.62v-99.36H662.635v104.26c0 147.73 97.319 221.24 223.344 221.24"
            transform="translate(-662.63 1586.97)"
          />
        </svg>
      ) : (
        <svg
          className={`${{ xs: "h-4", sm: "h-6", md: "h-8", lg: "h-12" }[size]} `}
          width="100%"
          height="100%"
          viewBox="0 0 3480 506"
          fill="currentColor"
          style={{
            fillRule: "evenodd",
            clipRule: "evenodd",
            strokeLinejoin: "round",
            strokeMiterlimit: 2,
          }}
        >
          <g transform="matrix(1,0,0,1,-1251.29,2949.83)">
            <g transform="matrix(1,0,0,1,1073.85,-1362.86)">
              <path
                d="M363.675,-1579.97L177.438,-1579.97L177.438,-1089.87L372.777,-1089.87C528.908,-1089.87 610.124,-1151.48 610.124,-1240.4C610.124,-1302.01 570.916,-1341.22 498.802,-1358.72C545.711,-1378.33 574.417,-1411.93 574.417,-1458.14C574.417,-1526.76 513.505,-1579.97 363.675,-1579.97ZM312.565,-1189.99L312.565,-1288.71L383.979,-1288.71C430.888,-1288.71 467.296,-1271.9 467.296,-1240.4C467.296,-1209.59 433.689,-1189.99 387.48,-1189.99L312.565,-1189.99ZM312.565,-1383.23L312.565,-1472.85L374.877,-1472.85C419.686,-1472.85 444.891,-1460.24 444.891,-1430.14C444.891,-1400.03 419.686,-1383.23 374.877,-1383.23L312.565,-1383.23Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
            <g transform="matrix(-5.55112e-17,-1,-1,5.55112e-17,318.976,-1999.02)">
              <path
                d="M840.47,-1417.51L923.787,-1417.51L950.802,-1882.4L840.47,-1882.4L840.47,-1417.51Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
            <g transform="matrix(1,0,0,1,1073.85,-1362.86)">
              <path
                d="M885.979,-1081.47C1023.91,-1081.47 1127.53,-1154.98 1127.53,-1302.71L1127.53,-1406.97L983.999,-1406.97L983.999,-1307.61C983.999,-1232.7 952.493,-1196.99 892.281,-1196.99C834.869,-1196.99 802.663,-1234.1 802.663,-1307.61L802.663,-1406.97L662.635,-1406.97L662.635,-1302.71C662.635,-1154.98 759.954,-1081.47 885.979,-1081.47Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
            <g transform="matrix(1,0,0,1,1073.85,-1362.86)">
              <path
                d="M1381.68,-1081.47C1521.01,-1081.47 1619.73,-1143.78 1619.73,-1249.5C1619.73,-1325.12 1573.52,-1356.62 1467.8,-1389.53C1385.88,-1414.73 1350.87,-1419.63 1350.87,-1444.14C1350.87,-1466.54 1380.28,-1477.05 1428.59,-1477.05C1492.3,-1477.05 1546.91,-1463.04 1581.22,-1446.94L1564.41,-1569.47C1532.21,-1579.97 1476.9,-1586.97 1426.49,-1586.97C1280.86,-1586.97 1197.54,-1526.06 1197.54,-1439.24C1197.54,-1365.02 1240.25,-1322.32 1348.07,-1292.21C1439.09,-1267.01 1466.39,-1258.6 1466.39,-1234.8C1466.39,-1206.09 1427.89,-1195.59 1369.78,-1195.59C1308.16,-1195.59 1233.25,-1215.89 1184.24,-1244.6L1209.44,-1108.07C1247.95,-1091.97 1319.37,-1081.47 1381.68,-1081.47Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
            <g transform="matrix(1,0,0,1,1073.85,-1362.86)">
              <path
                d="M1854.27,-1081.47C1993.6,-1081.47 2092.32,-1143.78 2092.32,-1249.5C2092.32,-1325.12 2046.11,-1356.62 1940.39,-1389.53C1858.47,-1414.73 1823.47,-1419.63 1823.47,-1444.14C1823.47,-1466.54 1852.87,-1477.05 1901.18,-1477.05C1964.89,-1477.05 2019.51,-1463.04 2053.81,-1446.94L2037.01,-1569.47C2004.8,-1579.97 1949.49,-1586.97 1899.08,-1586.97C1753.45,-1586.97 1670.14,-1526.06 1670.14,-1439.24C1670.14,-1365.02 1712.85,-1322.32 1820.67,-1292.21C1911.68,-1267.01 1938.99,-1258.6 1938.99,-1234.8C1938.99,-1206.09 1900.48,-1195.59 1842.37,-1195.59C1780.76,-1195.59 1705.84,-1215.89 1656.83,-1244.6L1682.04,-1108.07C1720.55,-1091.97 1791.96,-1081.47 1854.27,-1081.47Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
            <g transform="matrix(1,0,0,1,1073.85,-1362.86)">
              <path
                d="M2410.18,-1082.87C2565.62,-1082.87 2689.54,-1189.99 2689.54,-1334.92C2689.54,-1479.85 2567.72,-1586.97 2410.18,-1586.97C2252.65,-1586.97 2130.83,-1479.85 2130.83,-1334.92C2130.83,-1189.99 2254.75,-1082.87 2410.18,-1082.87ZM2277.16,-1334.92C2277.16,-1422.44 2344.37,-1465.14 2410.18,-1465.14C2476,-1465.14 2543.21,-1422.44 2543.21,-1334.92C2543.21,-1247.4 2476,-1204.69 2410.18,-1204.69C2344.37,-1204.69 2277.16,-1247.4 2277.16,-1334.92Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
            <g transform="matrix(1,0,0,1,1073.85,-1362.86)">
              <path
                d="M2749.75,-1579.97L2749.75,-1089.87L3098.42,-1089.87L3112.42,-1203.29L2893.28,-1203.29L2893.28,-1579.97L2749.75,-1579.97Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
            <g transform="matrix(1,0,0,1,1073.85,-1362.86)">
              <path
                d="M3508.7,-1157.08L3517.81,-1092.67L3657.13,-1092.67L3657.13,-1346.82C3657.13,-1512.05 3564.01,-1586.97 3379.88,-1586.97C3308.46,-1586.97 3227.95,-1573.67 3181.74,-1555.46L3166.34,-1435.04C3209.74,-1455.34 3287.46,-1469.35 3353.27,-1469.35C3454.09,-1469.35 3494.7,-1437.84 3501,-1376.93C3477.2,-1381.13 3435.89,-1385.33 3390.38,-1385.33C3203.44,-1385.33 3131.33,-1315.31 3131.33,-1226.4C3131.33,-1136.78 3205.54,-1082.87 3313.37,-1082.87C3392.48,-1082.87 3465.3,-1110.87 3508.7,-1157.08ZM3286.76,-1241.1C3286.76,-1278.91 3327.37,-1305.51 3427.49,-1305.51C3450.59,-1305.51 3477.2,-1303.41 3501.7,-1300.61L3501.7,-1238.3C3471.6,-1208.19 3418.39,-1185.79 3364.47,-1185.79C3318.27,-1185.79 3286.76,-1205.39 3286.76,-1241.1Z"
                style={{ fillRule: "nonzero" }}
              />
            </g>
          </g>
        </svg>
      )}
    </div>

    // <h1
    //   className="relative select-none font-black leading-none tracking-tight"
    //   style={{ fontSize: size + "px" }}
    // >
    //   <span>BUSSOL</span>
    //   <span className="font-bold" style={{ fontSize: 1.35 * size + "px" }}>
    //     a
    //   </span>
    //   <span
    //     className="absolute"
    //     style={{ top: size / 12 + "px", left: size / 1.2 + "px" }}
    //   >
    //     ´
    //   </span>
    // </h1>
  );
}

export const Content = ({
  action,
  aspect,
  partner,
  className,
}: {
  action:
    | Action
    | (Action & {
        previews: { preview: string; type: string }[] | null;
      });
  aspect: "feed" | "full" | "squared";
  partner: Partner;
  className?: string;
}) => {
  let files =
    "previews" in action && action.previews
      ? action.previews
      : action.files && action.files[0]
        ? action.files.map((f) => ({
            preview: f,
            type: getTypeOfTheContent(f),
          }))
        : undefined;

  let isPreview = !(action.files !== null && action.files[0] !== "");

  return files && !["", "null", null].find((p) => p === files[0].preview) ? (
    // Se for carrossel ou Stories

    files.length > 1 && aspect !== "squared" ? (
      <div
        className={clsx(
          `flex snap-x snap-mandatory gap-[1px] overflow-hidden overflow-x-auto transition-opacity ${isPreview && "opacity-50"}`,
          className,
        )}
      >
        {files.map((file, i) => (
          <div className="w-full shrink-0 snap-center" key={i}>
            <img src={`${file.preview}`} />
          </div>
        ))}
      </div>
    ) : files[0].type === "image" ? (
      <img
        src={`${files[0].preview}`}
        className={cn(
          `object-cover transition-opacity ${aspect === "squared" ? "aspect-square" : ""} ${isPreview && "opacity-50"}`,
          className,
        )}
        style={{ backgroundColor: action.color }}
      />
    ) : (
      <video
        src={files[0].preview}
        className={clsx(
          `w-full object-cover ${aspect === "squared" ? "aspect-square" : aspect === "feed" ? "aspect-[4/5]" : ""}`,
          className,
        )}
        controls
      />
    )
  ) : (
    <Post className={className} action={action} colors={partner!.colors} />
  );
};

export const Post = ({
  action,
  colors,
  className,
}: {
  action: Action;
  colors: string[];
  className?: string;
}) => {
  let factor = Math.floor(Math.random() * colors.length);
  factor = factor === 1 ? factor - 1 : factor;

  const bgColor =
    action.color && action.color != "null" ? action.color : colors[factor];

  return (
    <div
      className={clsx(
        `grid aspect-square place-content-center overflow-hidden transition-opacity @container`,
        className,
      )}
      style={{
        backgroundColor: bgColor,
        color:
          bgColor !== BASE_COLOR
            ? Color(bgColor).contrast(Color("white")) > 2
              ? "white"
              : Color(bgColor).darken(0.5).desaturate(0.5)
            : undefined,
      }}
    >
      <div className="p-2 text-center text-[10px] font-semibold leading-none @[120px]:text-[12px] @[200px]:p-4 @[200px]:text-[20px] @[200px]:tracking-tighter @[300px]:p-8 @[300px]:text-[24px]">
        {action.title}
      </div>
    </div>
  );
};

export function isInstagramFeed(category: string) {
  return ["post", "reels", "carousel"].includes(category);
}

export const Heart = () => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 32 32"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    className="fill-rose-500"
  >
    <path d="M0.256 12.16q0.544 2.080 2.080 3.616l13.664 14.144 13.664-14.144q1.536-1.536 2.080-3.616t0-4.128-2.080-3.584-3.584-2.080-4.16 0-3.584 2.080l-2.336 2.816-2.336-2.816q-1.536-1.536-3.584-2.080t-4.128 0-3.616 2.080-2.080 3.584 0 4.128z"></path>
  </svg>
);

export function getCategoriesSortedByContent(categories: Category[]) {
  const firsts = categories.filter((c) => isInstagramFeed(c.slug));
  const lasts = categories.filter((c) => !isInstagramFeed(c.slug));

  return [...firsts, ...lasts];
}

export function getTypeOfTheContent(content: string) {
  return /(.mp4|.mov)$/.test(content.toLowerCase()) ? "video" : "image";
}

export const ReportReview = ({ partner }: { partner: Partner }) => {
  const [range, setRange] = useState<DateRange | undefined>({
    from: startOfDay(startOfWeek(new Date())),
    to: endOfDay(endOfWeek(new Date())),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"ghost"} size={"icon"} className="gap-2">
          <ClipboardCheckIcon className="size-6" />
          {/* <span className="hidden md:block lg:hidden 2xl:block">
            Gerar Relatório
          </span> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass">
        <Calendar
          mode="range"
          selected={range}
          locale={ptBR}
          onSelect={(range) => setRange(range)}
        />
        {range?.from && range.to ? (
          <div className="border-t border-accent/50 py-4">
            <div className="pb-4 text-center text-sm">
              {range.from && range.to
                ? `${format(range.from, "d/M/yy")} a ${format(range.to, "d/M/yy")}`
                : "Selecione um intervalo de datas"}
            </div>
            <div className="flex items-center justify-center">
              <div className="mr-4 text-sm">Relatório do</div>
              <Button variant={"ghost"} size={"sm"} asChild>
                <Link
                  to={`/report/${partner.slug}?range=${format(range.from, "yyyy-MM-dd")}---${format(range.to, "yyyy-MM-dd")}`}
                >
                  Período
                </Link>
              </Button>
              <Button variant={"ghost"} size={"sm"} asChild>
                <Link to={`/report/${partner.slug}`} target="_blank">
                  Mês
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

export function isSprint(action_id: string, sprints: Sprint[]) {
  return sprints.filter((s) => s.action_id === action_id).length > 0;
}
