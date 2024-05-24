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
							className="min-w-72 w-full max-h-[70vh] overflow-hidden  rounded-md  transition flex flex-col"
							key={state.id}
						>
							<div className="mb-2 flex items-center px-2 pt-2">
								<div
									className={`rounded-full px-3 border border-${state.slug} bg-${state.slug}-dark text-lg font-bold tracking-tight`}
									style={{ fontStretch: "85%" }}
								>
									{state.title}
								</div>
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
