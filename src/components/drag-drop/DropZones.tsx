'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import { DragDropState, DragDropZone } from '../../utils/dragDropUtils';
import { DRAG_ITEM_TYPE, SortableList } from './SortableList';

interface DropZonesProps {
  zones: DragDropZone[];
  state: DragDropState;
  onReorder: (zoneId: string, fromIndex: number, toIndex: number) => void;
  onMoveToZone: (itemId: string, fromZoneId: string, toZoneId: string, toIndex?: number) => void;
}

interface DragPayload {
  id: string;
  fromZoneId: string;
  index: number;
}

const ZonePanel = ({
  zone,
  itemsCount,
  children,
  onDropToZone,
}: {
  zone: DragDropZone;
  itemsCount: number;
  children: React.ReactNode;
  onDropToZone: (itemId: string, fromZoneId: string, toZoneId: string) => void;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: DRAG_ITEM_TYPE,
      drop: (dragged: DragPayload, monitor) => {
        if (monitor.didDrop()) {
          return;
        }
        if (dragged.fromZoneId !== zone.id) {
          onDropToZone(dragged.id, dragged.fromZoneId, zone.id);
          dragged.fromZoneId = zone.id;
          dragged.index = itemsCount;
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [itemsCount, onDropToZone, zone.id],
  );

  return (
    <section
      ref={drop}
      className={`rounded-xl border p-4 transition ${
        isOver && canDrop ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white'
      }`}
    >
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{zone.label}</h3>
          {zone.description ? <p className="text-xs text-slate-500">{zone.description}</p> : null}
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{itemsCount}</span>
      </header>
      {children}
    </section>
  );
};

export const DropZones = ({ zones, state, onReorder, onMoveToZone }: DropZonesProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {zones.map((zone) => {
        const items = state[zone.id] ?? [];

        return (
          <ZonePanel
            key={zone.id}
            zone={zone}
            itemsCount={items.length}
            onDropToZone={(itemId, fromZoneId, toZoneId) =>
              onMoveToZone(itemId, fromZoneId, toZoneId, items.length)
            }
          >
            <SortableList
              zoneId={zone.id}
              items={items}
              onReorder={onReorder}
              onMoveToZone={onMoveToZone}
            />
          </ZonePanel>
        );
      })}
    </div>
  );
};
