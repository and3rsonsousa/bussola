import { cn } from "~/lib/utils";

export default function Waves({
  size = 100,
  className,
  speed = 1,
}: {
  size?: number;
  className?: string;
  speed?: number;
}) {
  let radius = size / 2.1;
  speed = 10 * speed;
  return (
    <div
      className={cn(`relative`, className)}
      style={{ width: size + "px", height: size + "px" }}
    >
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 animate-spin border-4 border-primary`}
          style={{
            borderRadius: radius / 1.05 + "px",
            animationDuration: speed * 1.0278 + "s",
          }}
        ></div>
        <div
          className={`absolute inset-0 animate-spin border-2 border-primary`}
          style={{
            borderRadius: radius / 1.1 + "px",
            animationDuration: speed * 1.643 + "s",
          }}
        ></div>
        <div
          className={`absolute inset-0 animate-spin border border-primary`}
          style={{
            borderRadius: radius / 1.15 + "px",
            animationDuration: speed * 2.9781 + "s",
          }}
        ></div>
      </div>
      <div className="absolute inset-0 blur-lg">
        <div
          className={`absolute inset-0 animate-spin border-[10px] border-primary`}
          style={{
            borderRadius: radius + "px",
            animationDuration: speed * 1.0278 + "s",
          }}
        ></div>
        <div
          className={`absolute inset-0 animate-spin border-8 border-primary`}
          style={{
            borderRadius: radius + "px",
            animationDuration: speed * 1.643 + "s",
          }}
        ></div>
        <div
          className={`absolute inset-0 animate-spin border-8 border-primary`}
          style={{
            borderRadius: radius + "px",
            animationDuration: speed * 2.9781 + "s",
          }}
        ></div>
      </div>
    </div>
  );
}
