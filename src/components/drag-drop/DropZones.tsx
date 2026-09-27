'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DragDropState, DragDropZone } from '../../utils/dragDropUtils';
import { SortableList } from './SortableList';

interface DropZonesProps {
  zones: DragDropZone[];
  state: DragDropState;
}

const ZonePanel = ({
  zone,
  itemsCount,
  children,
}: {
  zone: DragDropZone;
  itemsCount: number;
  children: React.ReactNode;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: zone.id,
    data: {
      type: 'ZONE',
      zone,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-xl border p-4 transition ${
        isOver ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white'
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

export const DropZones = ({ zones, state }: DropZonesProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {zones.map((zone) => {
        const items = state[zone.id] ?? [];

        return (
          <ZonePanel key={zone.id} zone={zone} itemsCount={items.length}>
            <SortableList zoneId={zone.id} items={items} />
          </ZonePanel>
        );
      })}
    </div>
  );
};
