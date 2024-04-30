import { cn } from "~/lib/utils";

export default function Badge({
	value,
	average = 2,
	isDynamic,
	className,
}: {
	value: number;
	average?: number;
	isDynamic?: boolean;
	className?: string;
}) {
	return value > 0 ? (
		<div
			className={cn(
				`absolute top-0 right-0 text-center p-1.5 py-0 grid place-content-center rounded-full font-bold text-sm ${
					isDynamic
						? value > average
							? "bg-error-600 text-error-200"
							: "bg-alert-500 text-alert-100"
						: "bg-primary text-primary-foreground"
				}`,
				className
			)}
		>
			{value}
		</div>
	) : null;
}
