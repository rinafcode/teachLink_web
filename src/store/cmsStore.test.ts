import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCMSStore } from './cmsStore';

describe('cmsStore persist middleware', () => {
  beforeEach(() => {
    // Clear storage and reset store
    sessionStorage.clear();
    useCMSStore.persist.clearStorage();
    useCMSStore.setState({
      course: { id: '', title: '', description: '', modules: [] },
      history: [],
      historyIndex: -1,
      mediaQueue: [],
      templates: [],
      isSaving: false,
    });
  });

  it('persists history, historyIndex, and course state to sessionStorage', () => {
    const course = { id: '1', title: 'Test Course', description: 'Test', modules: [] };

    useCMSStore.getState().setCourse(course);

    // Check sessionStorage
    const stored = JSON.parse(sessionStorage.getItem('cms-storage') || '{}');
    expect(stored.state).toBeDefined();
    expect(stored.state.course).toEqual(course);
    expect(stored.state.history.length).toBe(1);
    expect(stored.state.historyIndex).toBe(0);
  });

  it('rehydrates correctly and allows undo after refresh', async () => {
    const course1 = { id: '1', title: 'Course v1', description: '', modules: [] };
    const course2 = { id: '1', title: 'Course v2', description: '', modules: [] };

    useCMSStore.getState().setCourse(course1);
    useCMSStore.getState().updateCourse({ title: 'Course v2' });

    // Store state before rehydration
    const stateBefore = useCMSStore.getState();
    expect(stateBefore.course.title).toBe('Course v2');
    expect(stateBefore.historyIndex).toBe(1);
    expect(stateBefore.history.length).toBe(2);

    // Simulate page refresh by resetting store state to defaults
    useCMSStore.setState({
      course: { id: '', title: '', description: '', modules: [] },
      history: [],
      historyIndex: -1,
    });

    // Rehydrate store from sessionStorage
    await useCMSStore.persist.rehydrate();

    // Verify state is restored
    const stateAfterRehydrate = useCMSStore.getState();
    expect(stateAfterRehydrate.course.title).toBe('Course v2');
    expect(stateAfterRehydrate.historyIndex).toBe(1);
    expect(stateAfterRehydrate.history.length).toBe(2);

    // Perform undo
    useCMSStore.getState().undo();

    // Verify undo worked
    const stateAfterUndo = useCMSStore.getState();
    expect(stateAfterUndo.course.title).toBe('Course v1');
    expect(stateAfterUndo.historyIndex).toBe(0);
  });

  it('limits history to 20 items to save sessionStorage quota', () => {
    for (let i = 0; i < 25; i++) {
      useCMSStore.getState().updateCourse({ title: `Course v${i}` });
    }

    const state = useCMSStore.getState();
    expect(state.history.length).toBe(20);
    expect(state.historyIndex).toBe(19);

    // The first 5 should be dropped, so the oldest item is v5
    expect(state.history[0].title).toBe('Course v5');
    expect(state.history[19].title).toBe('Course v24');
  });
});
