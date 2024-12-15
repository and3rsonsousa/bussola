import { useMatches, useSubmit } from "@remix-run/react";
import { BlockOfActions } from "./Action";
import { useEffect, useState } from "react";
import { INTENTS } from "~/lib/constants";
import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";

export default function Kanban({ actions }: { actions: Action[] }) {
  const matches = useMatches();
  const submit = useSubmit();

  const { states } = matches[1].data as DashboardRootType;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const state = over?.id as string;
    const actionState = active.data.current?.state as string;
    const draggedAction = actions?.find((action) => action.id === active.id)!;

    if (state !== actionState) {
      submit(
        {
          ...draggedAction,
          state,
          intent: INTENTS.updateAction,
        },
        {
          action: "/handle-actions",
          method: "POST",
          navigate: false,
          fetcherKey: `action:${active.id}:update:move:kanban`,
        },
      );
    }
  };

  return (
    <div className="overflow-hidden pb-4">
      <div className="scrollbars-horizontal scrollbars-horizontal-thin">
        <div className="flex w-full gap-2">
          <DndContext onDragEnd={handleDragEnd}>
            {states.map((state) => {
              const stateActions = actions.filter(
                (action) => action.state === state.slug,
              );
              return <KanbanColumn state={state} actions={stateActions} />;
            })}
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ state, actions }: { state: State; actions: Action[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: state.slug });
  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-[60vh] shrink-0 ${actions.length > 0 ? "min-w-72 grow" : "w-auto 2xl:min-w-72 2xl:grow"} flex-col overflow-hidden ${isOver ? "dragover" : ""}`}
      key={state.slug}
    >
      <div className="mb-2 flex items-center">
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
        <BlockOfActions max={1} actions={actions} sprint />
      </div>
    </div>
  );
}
