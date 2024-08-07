export default function Loader({
  size,
  colors = true,
}: {
  size?: "sm" | "md" | "lg";
  colors?: boolean;
}) {
  let measure = 20;
  switch (size) {
    case "sm":
      measure = 10;
      break;
    case "md":
      measure = 15;
      break;
  }

  return (
    <div
      className="relative animate-spin"
      style={{ width: measure * 2, height: measure * 2 }}
    >
      {colors ? (
        [
          "stroke-idea",
          "stroke-do",
          "stroke-doing",
          "stroke-review",
          "stroke-done",
          "stroke-finished",
        ].map((strokeColor, i) => (
          <div
            className="absolute left-0 top-0 h-full w-full"
            key={i}
            style={{ rotate: `${i * 60}deg` }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              className="absolute left-0 top-0"
              width={measure * 2}
              height={measure * 2}
            >
              <circle
                cx={measure}
                cy={measure}
                className={strokeColor}
                r={Math.ceil(measure - measure / 3)}
                strokeWidth={Math.ceil(measure / 3)}
                strokeDasharray={`${Math.ceil((measure * 2) / 3) + 1} 1000`}
                fill="transparent"
              />
            </svg>
          </div>
        ))
      ) : (
        <div
          style={{
            borderWidth: Math.ceil(measure / 3) + "px",
          }}
          className="h-full w-full rounded-full border-foreground border-b-transparent"
        ></div>
      )}
    </div>
  );
}
