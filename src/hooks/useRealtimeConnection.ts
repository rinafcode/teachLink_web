'use client';

import { useEffect, useState } from 'react';
import {
  ConnectionSupervisor,
  type ConnectionStatus,
  getSupervisor,
  onSupervisorRegistered,
} from '@/lib/realtime/connectionSupervisor';

const DEFAULT_STATUS: ConnectionStatus = {
  phase: 'idle',
  isConnected: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  queuedCount: 0,
};

/**
 * Subscribe to the unified connection status of a named realtime connection
 * (e.g. `websocket:messaging`, `notifications`, `graphql-subscriptions`,
 * `collaboration:<roomId>`). Falls back to the idle status while the connection
 * has not been registered yet, so consumers see one consistent status shape
 * regardless of the underlying transport.
 */
export function useRealtimeConnection(name: string): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(
    () => getSupervisor(name)?.getStatus() ?? DEFAULT_STATUS,
  );

  useEffect(() => {
    let unsubscribeStatus: (() => void) | undefined;

    const attach = (supervisor: ConnectionSupervisor) => {
      setStatus(supervisor.getStatus());
      unsubscribeStatus = supervisor.onStatusChange(setStatus);
    };

    const existing = getSupervisor(name);
    if (existing) {
      attach(existing);
    }

    const removeRegistrationListener = onSupervisorRegistered((registeredName, supervisor) => {
      if (registeredName === name) {
        unsubscribeStatus?.();
        attach(supervisor);
      }
    });

    return () => {
      unsubscribeStatus?.();
      removeRegistrationListener();
    };
  }, [name]);

  return status;
}
