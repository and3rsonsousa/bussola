import { Avatar } from "~/lib/helpers";

export default function UI() {
	<div>
		<h1
			className="text-5xl uppercase font-extrabold"
			style={{ fontStretch: "125%" }}
		>
			Parceiros
		</h1>
		<div className="flex gap-2 mt-4">
			<Avatar item={{ short: "cnvt" }} size="xs" />
			<Avatar item={{ short: "brenda" }} size="xs" />
			<Avatar item={{ short: "arc" }} size="xs" />
			<Avatar item={{ short: "smart" }} size="xs" />
			<div className="flex">
				<Avatar item={{ short: "cnvt" }} group size="xs" />
				<Avatar item={{ short: "brenda" }} group size="xs" />
				<Avatar item={{ short: "arc" }} group size="xs" />
				<Avatar item={{ short: "smart" }} group size="xs" />
			</div>
		</div>

		<div className="flex gap-2 mt-4">
			<Avatar item={{ short: "cnvt" }} />
			<Avatar item={{ short: "brenda" }} />
			<Avatar item={{ short: "arc" }} />
			<Avatar item={{ short: "smart" }} />
			<div className="flex">
				<Avatar item={{ short: "cnvt" }} group />
				<Avatar item={{ short: "brenda" }} group />
				<Avatar item={{ short: "arc" }} group />
				<Avatar item={{ short: "smart" }} group />
			</div>
		</div>

		<div className="flex gap-2 mt-4">
			<Avatar item={{ short: "cnvt" }} size="md" />
			<Avatar item={{ short: "brenda" }} size="md" />
			<Avatar item={{ short: "arc" }} size="md" />
			<Avatar item={{ short: "smart" }} size="md" />
			<div className="flex">
				<Avatar item={{ short: "cnvt" }} group size="md" />
				<Avatar item={{ short: "brenda" }} group size="md" />
				<Avatar item={{ short: "arc" }} group size="md" />
				<Avatar item={{ short: "smart" }} group size="md" />
			</div>
		</div>

		<div className="flex gap-2 mt-4">
			<Avatar item={{ short: "cnvt" }} size="lg" />
			<Avatar item={{ short: "brenda" }} size="lg" />
			<Avatar item={{ short: "arc" }} size="lg" />
			<Avatar item={{ short: "smart" }} size="lg" />
			<div className="flex">
				<Avatar item={{ short: "cnvt" }} group size="lg" />
				<Avatar item={{ short: "brenda" }} group size="lg" />
				<Avatar item={{ short: "arc" }} group size="lg" />
				<Avatar item={{ short: "smart" }} group size="lg" />
			</div>
		</div>
	</div>;
}
