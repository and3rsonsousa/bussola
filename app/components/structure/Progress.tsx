import { useMatches } from "@remix-run/react";
import { cn } from "~/lib/utils";
import { ChartContainer } from "../ui/chart";
import { Pie, PieChart } from "recharts";

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
          `${long ? "w-[calc(100%+40px)] -translate-x-[20px]" : "w-[calc(100%+20px)] -translate-x-[10px]"} mx-auto flex h-[1000px] -translate-y-1/2 overflow-hidden rounded-full bg-muted ${long ? "blur-[16px]" : "blur-[8px]"}`,
        ])}
      >
        {values.map((item) => {
          if (item.value) {
            const percentage = (item.value / total) * 100;

            return (
              <div
                key={item.id}
                style={{ width: percentage + "%", backgroundColor: item.color }}
                className={cn("h-full flex-shrink grow-0 bg-primary")}
              ></div>
            );
          } else return null;
        })}
      </div>
    </div>
  );
}

export const CircularProgress = ({
  actions,
  size = "sm",
  className,
}: {
  actions: Action[];
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const matches = useMatches();
  const { states } = matches[1].data as DashboardRootType;

  return (
    <ChartContainer
      config={{}}
      className={cn(
        `absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 ${{ sm: "h-16 w-16", md: "h-[5.5rem] w-[5.5rem]", lg: "h-28 w-28" }[size]}`,
        className,
      )}
      tabIndex={-1}
    >
      <PieChart tabIndex={-1}>
        <Pie
          tabIndex={-1}
          dataKey={"actions"}
          nameKey={"state"}
          innerRadius={"70%"}
          data={states.map((state) => {
            return {
              state: state.title,
              actions: actions?.filter((action) => action.state === state.slug)
                .length,
              fill: state.color,
            };
          })}
        />
      </PieChart>
    </ChartContainer>
  );
};
