import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock yjs with minimal in-memory implementations used by the hook
vi.mock('yjs', () => {
  class YText {
    content = '';
    observers = new Set<() => void>();
    toString() {
      return this.content;
    }
    observe(cb: () => void) {
      this.observers.add(cb);
    }
    insert(pos: number, text: string) {
      this.content = this.content.slice(0, pos) + text + this.content.slice(pos);
      this.observers.forEach((cb) => cb());
    }
    delete(pos: number, len: number) {
      this.content = this.content.slice(0, pos) + this.content.slice(pos + len);
      this.observers.forEach((cb) => cb());
    }
  }

  class YArray<T = any> {
    items: T[] = [];
    observers = new Set<() => void>();
    toArray() {
      return this.items.slice();
    }
    observe(cb: () => void) {
      this.observers.add(cb);
    }
    push(arr: T[]) {
      this.items.push(...arr);
      this.observers.forEach((cb) => cb());
    }
    delete(start: number, len: number) {
      this.items.splice(start, len);
      this.observers.forEach((cb) => cb());
    }
    get length() {
      return this.items.length;
    }
  }

  class Doc {
    _text?: YText;
    _arrays: Record<string, any> = {};
    getText(_name: string) {
      if (!this._text) this._text = new YText();
      return this._text;
    }
    getArray(name: string) {
      if (!this._arrays[name]) this._arrays[name] = new YArray();
      return this._arrays[name];
    }
    destroy() {
      /* noop */
    }
  }

  return { Doc, Text: YText, Array: YArray };
});

// Mock y-websocket provider used by the hook
vi.mock('y-websocket', () => ({
  WebsocketProvider: class {
    awareness: any;
    constructor(_url: string, _room: string, _doc: any, _opts: any) {
      this.awareness = {
        states: new Map(),
        getStates: () => this.awareness.states,
        setLocalStateField: () => {},
        on: () => {},
        off: () => {},
      };
    }
    on() {
      /* noop */
    }
    disconnect() {
      /* noop */
    }
  },
}));

import { CollaborativeEditor } from '../CollaborativeEditor';

describe('CollaborativeEditor', () => {
  it('sends chat messages and displays them', async () => {
    const user = { id: 'u1', name: 'Tester', avatar: '', color: '#000' } as any;

    render(<CollaborativeEditor roomId="room-1" user={user} />);

    const input = screen.getByPlaceholderText('Send a message to your team') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello team' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    const message = await screen.findByText('Hello team');
    expect(message).toBeTruthy();
  });
});
