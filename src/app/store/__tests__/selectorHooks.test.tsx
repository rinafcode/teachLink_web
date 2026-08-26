import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  useMessagingStore,
  useMessagingStoreSelector,
} from '../messagingStore';
import {
  useNotificationStore,
  useNotificationStoreSelector,
} from '../notificationStore';
import {
  useVolunteerStore,
  useVolunteerStoreSelector,
} from '../volunteerStore';

describe('store selector hooks', () => {
  it('does not re-render a messaging selector for unrelated state changes', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useMessagingStoreSelector((state) => state.messages);
    });

    act(() => useMessagingStore.getState().setTyping(!useMessagingStore.getState().isTyping));

    expect(result.current).toEqual([]);
    expect(renders).toBe(1);
  });

  it('does not re-render a notification selector for unrelated state changes', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useNotificationStoreSelector((state) => state.notifications);
    });

    act(() => useNotificationStore.setState({ clearRead: () => undefined }));

    expect(result.current).toEqual([]);
    expect(renders).toBe(1);
  });

  it('does not re-render a volunteer selector for unrelated state changes', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useVolunteerStoreSelector((state) => state.volunteers);
    });

    act(() => useVolunteerStore.setState({ removeVolunteer: () => undefined }));

    expect(result.current).toEqual([]);
    expect(renders).toBe(1);
  });
});
