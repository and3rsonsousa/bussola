import { useMatches, useSubmit } from "@remix-run/react";
import { BlockOfActions } from "./Action";
import { useEffect, useState } from "react";
import { INTENTS } from "~/lib/constants";

export default function Kanban({ actions }: { actions: Action[] }) {
  const matches = useMatches();
  const submit = useSubmit();

  const { states } = matches[1].data as DashboardDataType;

  const [draggedAction, onDrag] = useState<Action | undefined>();

  useEffect(() => {
    if (draggedAction) {
      const state = document.querySelector(".dragover") as HTMLElement;
      const state_id = state?.getAttribute("data-state") as string;

      console.log({ state_id, draggedAction });

      if (state_id !== draggedAction.state_id) {
        //
        submit(
          {
            ...draggedAction,
            state_id: state_id,
            intent: INTENTS.updateAction,
          },
          {
            action: "/handle-actions",
            method: "POST",
            navigate: false,
            fetcherKey: `action:${draggedAction.id}:update:move:calendar`,
          },
        );
      }
      //reset
      onDrag(undefined);
    }
  }, [draggedAction, submit]);

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
                className={`flex max-h-[60vh] shrink-0 ${stateActions.length > 0 ? "min-w-72 grow" : "w-auto xl:min-w-72 xl:grow"} flex-col  overflow-hidden transition`}
                key={state.id}
                data-state={state.id}
                onDragOver={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  document
                    .querySelectorAll(".dragover")
                    .forEach((e) => e.classList.remove("dragover"));
                  e.currentTarget.classList.add("dragover");
                }}
                onDragEnd={(e) => {
                  setTimeout(() => {
                    document
                      .querySelectorAll(".dragover")
                      .forEach((e) => e.classList.remove("dragover"));
                  }, 500);
                }}
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
                  <BlockOfActions
                    onDrag={onDrag}
                    max={1}
                    actions={stateActions}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
