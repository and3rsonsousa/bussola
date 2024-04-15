import { cn } from "~/lib/utils"

export default function Progress(props: {
  values: {
    id: string | number
    title: string
    value?: number
    color?: string
  }[]
  total: number
  className?: string
}) {
  return (
    <div
      className={cn(
        " flex h-1 w-full overflow-hidden rounded-full bg-muted",
        props.className
      )}
    >
      {props.values.map((item) => {
        if (item.value) {
          const percentage = (item.value / props.total) * 100

          return (
            <div
              key={item.id}
              style={{ width: percentage + "%" }}
              className={cn("h-full flex-shrink grow-0 bg-primary", item.color)}
            ></div>
          )
        }
      })}
    </div>
  )
}
