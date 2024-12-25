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
          `${long ? "w-[calc(100%+40px)] -translate-x-[20px]" : "w-[calc(100%+20px)] -translate-x-[10px]"} bg-muted mx-auto flex h-[1000px] -translate-y-1/2 overflow-hidden rounded-full ${long ? "blur-[16px]" : "blur-[8px]"}`,
        ])}
      >
        {values.map((item) => {
          if (item.value) {
            const percentage = (item.value / total) * 100;

            return (
              <div
                key={item.id}
                style={{ width: percentage + "%", backgroundColor: item.color }}
                className={cn("bg-primary h-full shrink grow-0")}
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
  absolute,
  title,
}: {
  actions: Action[];
  size?: Size;
  className?: string;
  absolute?: boolean;
  title?: string;
}) => {
  const matches = useMatches();
  const { states } = matches[1].data as DashboardRootType;

  return (
    <ChartContainer
      title={title}
      config={{}}
      className={cn(
        `aspect-square ${{ xs: "size-12", sm: "size-16", md: "size-24", lg: "size-28", xl: "size-36" }[size]} ${absolute ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""}`,
        className,
      )}
      tabIndex={-1}
    >
      <PieChart tabIndex={-1}>
        <Pie
          tabIndex={-1}
          dataKey={"actions"}
          nameKey={"state"}
          innerRadius={
            { xs: "60%", sm: "65%", md: "62%", lg: "65%", xl: "65%" }[size]
          }
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
