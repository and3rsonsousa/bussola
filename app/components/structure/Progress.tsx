import { cn } from "~/lib/utils";

export default function Progress({
  values,
  total,
  className,
  long,
}: {
  values: {
    id: string | number;
    title: string;
    value?: number;
    color?: string;
  }[];
  total: number;
  className?: string;
  long?: boolean;
}) {
  return (
    <div className={cn("h-1 overflow-hidden rounded-md", className)}>
      <div
        className={cn([
          `${long ? "w-[calc(100%+40px)] -translate-x-[20px]" : "w-[calc(100%+20px)] -translate-x-[10px]"} mx-auto flex h-20 -translate-y-10   overflow-hidden rounded-full bg-muted
          ${long ? "blur-[16px]" : "blur-[8px]"}`,
        ])}
      >
        {values.map((item) => {
          if (item.value) {
            const percentage = (item.value / total) * 100;

            return (
              <div
                key={item.id}
                style={{ width: percentage + "%" }}
                className={cn(
                  "h-full flex-shrink grow-0 bg-primary",
                  item.color,
                )}
              ></div>
            );
          } else return null;
        })}
      </div>
    </div>
  );
}
