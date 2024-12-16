import { useMatches, useSubmit } from "@remix-run/react";
import { BlockOfActions, ListOfActions } from "./Action";
import { useEffect, useState } from "react";
import { INTENTS } from "~/lib/constants";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { format } from "date-fns";

export default function Kanban({
  actions,
  list,
}: {
  actions: Action[];
  list: boolean;
}) {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  return (
    <div className="overflow-hidden pb-4">
      <div className="scrollbars-horizontal scrollbars-horizontal-thin">
        <div className="flex w-full gap-2">
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            {states.map((state) => {
              const stateActions = actions.filter(
                (action) => action.state === state.slug,
              );
              return (
                <KanbanColumn
                  key={state.id}
                  state={state}
                  actions={stateActions}
                  list={list}
                />
              );
            })}
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  state,
  actions,
  list,
}: {
  state: State;
  actions: Action[];
  list: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: state.slug });
  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-[60vh] shrink-0 rounded-2xl p-2 ${actions.length > 0 ? "min-w-72 grow" : "w-auto 2xl:min-w-72 2xl:grow"} flex-col overflow-hidden ${isOver ? "dragover" : ""}`}
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
      <div className="scrollbars scrollbars-thin pt-1">
        {list ? (
          <ListOfActions
            actions={actions}
            showCategory
            date={{ timeFormat: 1 }}
          />
        ) : (
          <BlockOfActions max={1} actions={actions} sprint />
        )}
      </div>
    </div>
  );
}
