export interface DragDropItem {
  id: string;
  title: string;
  type?: string;
  zoneId: string;
  order: number;
  metadata?: Record<string, unknown>;
}

export interface DragDropZone {
  id: string;
  label: string;
  description?: string;
  accepts?: string[];
}

export type DragDropState = Record<string, DragDropItem[]>;

export const sortItemsByOrder = (items: DragDropItem[]): DragDropItem[] => {
  return [...items].sort((a, b) => a.order - b.order);
};

export const normalizeOrder = (items: DragDropItem[]): DragDropItem[] => {
  return items.map((item, index) => ({
    ...item,
    order: index,
  }));
};

export const reorderItems = (
  items: DragDropItem[],
  fromIndex: number,
  toIndex: number,
): DragDropItem[] => {
  if (fromIndex === toIndex) {
    return normalizeOrder(items);
  }

  const updated = [...items];
  const [moved] = updated.splice(fromIndex, 1);
  if (!moved) {
    return normalizeOrder(items);
  }
  updated.splice(toIndex, 0, moved);

  return normalizeOrder(updated);
};

export const moveItemBetweenZones = (
  state: DragDropState,
  itemId: string,
  fromZoneId: string,
  toZoneId: string,
  toIndex?: number,
): DragDropState => {
  if (!state[fromZoneId] || !state[toZoneId]) {
    return state;
  }

  const sourceItems = [...state[fromZoneId]];
  const destinationItems = fromZoneId === toZoneId ? sourceItems : [...state[toZoneId]];

  const sourceIndex = sourceItems.findIndex((item) => item.id === itemId);
  if (sourceIndex === -1) {
    return state;
  }

  const [movedItem] = sourceItems.splice(sourceIndex, 1);
  if (!movedItem) {
    return state;
  }

  const insertAt =
    typeof toIndex === 'number'
      ? Math.max(0, Math.min(toIndex, destinationItems.length))
      : destinationItems.length;

  destinationItems.splice(insertAt, 0, {
    ...movedItem,
    zoneId: toZoneId,
  });

  if (fromZoneId === toZoneId) {
    return {
      ...state,
      [toZoneId]: normalizeOrder(destinationItems),
    };
  }

  return {
    ...state,
    [fromZoneId]: normalizeOrder(sourceItems),
    [toZoneId]: normalizeOrder(destinationItems),
  };
};

export const createInitialState = (
  zones: DragDropZone[],
  items: DragDropItem[],
): DragDropState => {
  const state: DragDropState = {};

  zones.forEach((zone) => {
    state[zone.id] = [];
  });

  items.forEach((item) => {
    if (!state[item.zoneId]) {
      state[item.zoneId] = [];
    }
    state[item.zoneId].push(item);
  });

  Object.keys(state).forEach((zoneId) => {
    state[zoneId] = normalizeOrder(sortItemsByOrder(state[zoneId]));
  });

  return state;
};
