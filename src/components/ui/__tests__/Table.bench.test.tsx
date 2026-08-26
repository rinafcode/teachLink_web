import React, { Profiler, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table, ColumnDef } from '../Table';
import { makeProfilerRecorder } from '@/testing/utils/renderProfiler';

interface Row {
  id: string;
  name: string;
  role: string;
}

const ROW_COUNT = 300;
const rows: Row[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
  id: String(i),
  name: `Person ${i}`,
  role: 'Student',
}));

const columns: ColumnDef<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
];

// Reconstructs the *pre-refactor* shape of Table.tsx: an unmemoized row
// component, receiving a fresh inline `onSelect` closure every render, with
// no pagination — i.e. the exact pattern this refactor removed.
function LegacyRow({
  row,
  selected,
  onSelect,
}: {
  row: Row;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div role="row" className="flex items-center min-h-[48px]">
      <input type="checkbox" checked={selected} onChange={onSelect} aria-label="Select row" />
      <div role="gridcell">{row.name}</div>
      <div role="gridcell">{row.role}</div>
    </div>
  );
}

function LegacyTable({
  data,
  selectedRowKeys,
  onSelectionChange,
}: {
  data: Row[];
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
}) {
  return (
    <div role="table">
      {data.map((row) => (
        <LegacyRow
          key={row.id}
          row={row}
          selected={selectedRowKeys.includes(row.id)}
          onSelect={() =>
            onSelectionChange(
              selectedRowKeys.includes(row.id)
                ? selectedRowKeys.filter((k) => k !== row.id)
                : [...selectedRowKeys, row.id],
            )
          }
        />
      ))}
    </div>
  );
}

function LegacyWrapper({ recorderId }: { recorderId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Profiler id={recorderId} onRender={(...args) => recorders[recorderId](...args)}>
      <LegacyTable data={rows} selectedRowKeys={selected} onSelectionChange={setSelected} />
    </Profiler>
  );
}

function CurrentWrapper({ recorderId }: { recorderId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Profiler id={recorderId} onRender={(...args) => recorders[recorderId](...args)}>
      <Table
        columns={columns}
        data={rows}
        rowKey="id"
        pageSize={ROW_COUNT}
        selectedRowKeys={selected}
        onSelectionChange={setSelected}
      />
    </Profiler>
  );
}

const recorders: Record<string, ReturnType<typeof makeProfilerRecorder>['onRender']> = {};

describe('Table performance (before/after)', () => {
  it('[bench] selecting one row out of 300 re-renders far less work than the pre-refactor implementation', () => {
    const before = makeProfilerRecorder();
    recorders['before'] = before.onRender;
    render(<LegacyWrapper recorderId="before" />);
    before.reset();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    const after = makeProfilerRecorder();
    recorders['after'] = after.onRender;
    render(<CurrentWrapper recorderId="after" />);
    after.reset();
    // The memoized Table's checkboxes start at index 1 (index 0 is "select all").
    fireEvent.click(screen.getAllByRole('checkbox')[1]);

    // eslint-disable-next-line no-console
    console.info(
      `[bench:Table] select 1/${ROW_COUNT} rows -> before: ${before
        .totalDuration()
        .toFixed(3)}ms (unmemoized) | after: ${after.totalDuration().toFixed(3)}ms (memoized rows, stable onSelect)`,
    );

    expect(after.totalDuration()).toBeLessThan(before.totalDuration());
  });
});
