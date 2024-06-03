import { useMatches } from "@remix-run/react";
import { BlockOfActions } from "./Action";

export default function Kanban({ actions }: { actions: Action[] }) {
  const matches = useMatches();
  const { states } = matches[1].data as DashboardDataType;

  return (
    <div className="overflow-hidden">
      <div className="scrollbars-horizontal">
        <div className="flex w-full pb-4">
          {states.map((state) => {
            const stateActions = actions.filter(
              (action) => action.state_id === state.id,
            );
            return (
              <div
                className={`flex max-h-[60vh] w-full ${stateActions.length > 0 ? "min-w-72 " : "w-auto"} flex-col  overflow-hidden rounded-md transition`}
                key={state.id}
              >
                <div className="mb-2 flex items-center px-2 pt-2">
                  <div
                    className={`rounded-full px-3 bg-${state.slug} text-lg font-bold tracking-tight`}
                    style={{ fontStretch: "85%" }}
                  >
                    {state.title}
                  </div>
                </div>
                <div className="scrollbars scrollbars-thin p-2">
                  <BlockOfActions max={1} actions={stateActions} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
