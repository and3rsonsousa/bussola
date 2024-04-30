import { useMatches } from "@remix-run/react";
import { BlockOfActions } from "./Action";

export default function Kanban({ actions }: { actions: Action[] }) {
	const matches = useMatches();
	const { categories, priorities, states, clients } = matches[1]
		.data as DashboardDataType;

	return (
		<div className="overflow-hidden">
			<div className="scrollbars-horizontal scrollbars-horizontal ">
				<div className="flex w-full gap-4 pb-4">
					{states.map((state) => (
						<div className="min-w-52 w-full" key={state.id}>
							<div className="mb-2 flex items-center gap-2">
								<div
									className={`size-4 rounded-full border-4 border-${state.slug}`}
								></div>
								<h4 className="font-bold">{state.title}</h4>
							</div>
							{/* <ListOfActions
							categories={categories}
							priorities={priorities}
							states={states}
							clients={clients}
							showCategory={true}
							date={{
								dateFormat: 0,
								timeFormat: 1,
							}}
							actions={actions.filter(
								(action) => action.state_id === state.id
							)}
						/> */}
							<BlockOfActions
								categories={categories}
								priorities={priorities}
								states={states}
								clients={clients}
								max={1}
								actions={actions.filter(
									(action) => action.state_id === state.id
								)}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
