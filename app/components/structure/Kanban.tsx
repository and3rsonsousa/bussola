import { useMatches } from "@remix-run/react";
import { BlockOfActions } from "./Action";

export default function Kanban({ actions }: { actions: Action[] }) {
	const matches = useMatches();
	const { states } = matches[1].data as DashboardDataType;

	return (
		<div className="overflow-hidden">
			<div className="scrollbars-horizontal">
				<div className="flex w-full pb-4">
					{states.map((state) => (
						<div
							className="min-w-72 w-full max-h-[70vh] overflow-hidden"
							key={state.id}
						>
							<div className="mb-2 flex items-center gap-2 px-2">
								<div
									className={`size-4 rounded-full border-4 border-${state.slug}`}
								></div>
								<h4 className="font-bold">{state.title}</h4>
							</div>
							<div className="scrollbars p-2 scrollbars-thin">
								<BlockOfActions
									max={1}
									actions={actions.filter(
										(action) => action.state_id === state.id
									)}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
