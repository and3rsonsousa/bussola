import { cn } from "~/lib/utils";

export default function Badge({
  value,
  average = 2,
  isDynamic,
  className,
  title,
}: {
  value: number;
  average?: number;
  isDynamic?: boolean;
  className?: string;
  title?: string;
}) {
  return value > 0 ? (
    <div
      title={title}
      className={cn(
        `grid h-6 place-content-center items-start rounded-full px-2 text-center text-sm font-bold ${
          isDynamic
            ? value > average
              ? "bg-rose-600 text-rose-200"
              : "bg-amber-500 text-amber-100"
            : "bg-accent text-accent-foreground"
        }`,
        className,
      )}
    >
      {value}
    </div>
  ) : null;
}
