export default function Badge({
	value,
	average = 2,
}: {
	value: number;
	average?: number;
}) {
	return value > 0 ? (
		<div
			className={`absolute -top-2 -right-2 text-center size-4 grid place-content-center rounded font-bold text-xs ${
				value > average
					? "bg-error-600 text-error-200"
					: "bg-alert-500 text-alert-100"
			}`}
		>
			{value}
		</div>
	) : null;
}
