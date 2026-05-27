import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table, ColumnDef, TableRowAction } from '../Table';

interface TestData {
  id: string;
  name: string;
  role: string;
}

const columns: ColumnDef<TestData>[] = [
  { key: 'name', header: 'Name', width: 150, resizable: true } as any,
  { key: 'role', header: 'Role', width: 120 } as any,
];

const data: TestData[] = [
  { id: '1', name: 'John Doe', role: 'Instructor' },
  { id: '2', name: 'Jane Smith', role: 'Student' },
];

describe('Table Component', () => {
  it('renders table headers and row cell content', () => {
    render(<Table columns={columns} data={data} rowKey="id" />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('selects single row and select all rows', () => {
    const onSelectionChange = vi.fn();
    render(
      <Table
        columns={columns}
        data={data}
        rowKey="id"
        selectedRowKeys={['1']}
        onSelectionChange={onSelectionChange}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // checkbox 0 is select all, checkbox 1 is row 1, checkbox 2 is row 2
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();

    // Toggle row 2 selection
    fireEvent.click(checkboxes[2]);
    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);

    // Toggle select all
    fireEvent.click(checkboxes[0]);
    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('resizes columns using mouse events', () => {
    render(<Table columns={columns} data={data} rowKey="id" resizableColumns />);

    const handle = screen.getByTestId('resize-handle-name');
    expect(handle).toBeInTheDocument();

    fireEvent.mouseDown(handle, { clientX: 100 });
    const moveEvent = new MouseEvent('mousemove', { clientX: 150 });
    document.dispatchEvent(moveEvent);
    const upEvent = new MouseEvent('mouseup');
    document.dispatchEvent(upEvent);

    // No errors, mouse resize completed
  });

  it('resizes columns using touch events', () => {
    render(<Table columns={columns} data={data} rowKey="id" resizableColumns />);

    const handle = screen.getByTestId('resize-handle-name');

    fireEvent.touchStart(handle, { touches: [{ clientX: 100 }] });
    const moveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 150 } as any],
    });
    document.dispatchEvent(moveEvent);
    const endEvent = new TouchEvent('touchend');
    document.dispatchEvent(endEvent);

    // No errors, touch resize completed
  });

  it('swipes row to reveal actions', () => {
    const actionClick = vi.fn();
    const rowActions: TableRowAction<TestData>[] = [{ label: 'Edit', onClick: actionClick }];

    render(<Table columns={columns} data={data} rowKey="id" rowActions={rowActions} />);

    const row = screen.getByText('John Doe').closest('[role="row"]');
    expect(row).toBeInTheDocument();

    // Swipe left (horizontal displacement)
    fireEvent.touchStart(row!, { touches: [{ clientX: 300, clientY: 50 }] });
    fireEvent.touchMove(row!, { touches: [{ clientX: 100, clientY: 50 }] });
    fireEvent.touchEnd(row!, { changedTouches: [{ clientX: 100, clientY: 50 }] });

    // Actions revealed
    const actionBtns = screen.getAllByRole('button', { name: 'Edit' });
    expect(actionBtns[0]).toBeInTheDocument();

    fireEvent.click(actionBtns[0]);
    expect(actionClick).toHaveBeenCalled();
  });

  it('handles double tap gesture', () => {
    const onDoubleTap = vi.fn();
    render(<Table columns={columns} data={data} rowKey="id" onRowDoubleTap={onDoubleTap} />);

    const row = screen.getByText('John Doe').closest('[role="row"]');

    // First tap
    fireEvent.touchStart(row!, { touches: [{ clientX: 100, clientY: 50 }] });
    fireEvent.touchEnd(row!, { changedTouches: [{ clientX: 100, clientY: 50 }] });

    // Second tap (within 300ms)
    fireEvent.touchStart(row!, { touches: [{ clientX: 100, clientY: 50 }] });
    fireEvent.touchEnd(row!, { changedTouches: [{ clientX: 100, clientY: 50 }] });

    expect(onDoubleTap).toHaveBeenCalledWith(data[0]);
  });

  it('handles long press gesture', () => {
    const onLongPress = vi.fn();
    vi.useFakeTimers();

    render(<Table columns={columns} data={data} rowKey="id" onRowLongPress={onLongPress} />);

    const row = screen.getByText('John Doe').closest('[role="row"]');

    fireEvent.touchStart(row!, { touches: [{ clientX: 100, clientY: 50 }] });
    vi.advanceTimersByTime(500);

    expect(onLongPress).toHaveBeenCalledWith(data[0]);

    vi.useRealTimers();
  });
});
