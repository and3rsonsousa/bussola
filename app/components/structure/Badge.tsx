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
        `absolute right-0 top-0 grid place-content-center rounded-full p-1.5 py-0 text-center text-sm font-bold ${
          isDynamic
            ? value > average
              ? "bg-error-600 text-error-200"
              : "bg-alert-500 text-alert-100"
            : "bg-primary text-primary-foreground"
        }`,
        className,
      )}
    >
      {value}
    </div>
  ) : null;
}
