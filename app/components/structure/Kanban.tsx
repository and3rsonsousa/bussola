import { useMatches, useSubmit } from "@remix-run/react";
import { BlockOfActions } from "./Action";
import { useEffect, useState } from "react";
import { INTENTS } from "~/lib/constants";

export default function Kanban({ actions }: { actions: Action[] }) {
  const matches = useMatches();
  const submit = useSubmit();

  const { states } = matches[1].data as DashboardRootType;

  const [draggedAction, onDrag] = useState<Action | undefined>();

  useEffect(() => {
    if (draggedAction) {
      const ele = document.querySelector(".dragover") as HTMLElement;
      const state = ele?.getAttribute("data-state") as string;

      if (state !== draggedAction.state) {
        //
        submit(
          {
            ...draggedAction,
            state: state,
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
    <div className="overflow-hidden pb-4">
      <div className="scrollbars-horizontal">
        <div className="flex w-full gap-4">
          {states.map((state) => {
            const stateActions = actions.filter(
              (action) => action.state === state.slug,
            );
            return (
              <div
                className={`flex max-h-[60vh] shrink-0 ${stateActions.length > 0 ? "min-w-72 grow" : "w-auto 2xl:min-w-72 2xl:grow"} flex-col overflow-hidden rounded-xl`}
                key={state.slug}
                data-state={state.slug}
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
                <div className="mb-2 flex items-center px-1 pt-2">
                  <div
                    className={`tracking-tigh flex items-center gap-2 rounded-full font-bold`}
                  >
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: state.color }}
                    ></div>
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
