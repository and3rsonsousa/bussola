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
        `absolute top-0 right-0 grid translate-x-[calc(100%+8px)] place-content-center rounded-full p-1.5 py-0 text-center text-sm font-bold ${
          isDynamic
            ? value > average
              ? "text-error-200 bg-rose-600"
              : "bg-alert-500 text-alert-100"
            : "bg-accent text-accent-foreground"
        }`,
        className,
      )}
    >
      {value}
    </div>
  ) : null;
}
