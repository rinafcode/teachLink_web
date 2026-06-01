'use client';

import { useCallback, useRef, useState } from 'react';
import { FraudDetectionService } from '@/services/fraud-detection';
import type {
  UserActionContext,
  FraudDetectionResult,
  ConferenceAccessCheck,
} from '@/services/fraud-detection';
import type { CollaborationUser } from './useCollaboration';

interface UseFraudDetectionOptions {
  user: CollaborationUser;
  roomId: string;
  isHost?: boolean;
  hostUserId?: string;
}

interface UseFraudDetectionReturn {
  fraudScore: number;
  fraudEvents: FraudDetectionResult['events'];
  isBlocked: boolean;
  lastCheck: FraudDetectionResult | null;
  accessCheck: ConferenceAccessCheck | null;
  checkJoin: () => FraudDetectionResult;
  checkLeave: () => FraudDetectionResult;
  checkStartCall: () => FraudDetectionResult;
  checkScreenShare: (enabled: boolean) => FraudDetectionResult;
  checkAccess: () => ConferenceAccessCheck;
  checkMeetingBombing: () => FraudDetectionResult;
  resetScore: () => void;
}

export function useFraudDetection(
  service: FraudDetectionService,
  options: UseFraudDetectionOptions,
): UseFraudDetectionReturn {
  const { user, roomId, isHost = false, hostUserId } = options;
  const [fraudScore, setFraudScore] = useState(0);
  const [fraudEvents, setFraudEvents] = useState<FraudDetectionResult['events']>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastCheck, setLastCheck] = useState<FraudDetectionResult | null>(null);
  const [accessCheck, setAccessCheck] = useState<ConferenceAccessCheck | null>(null);

  const contextRef = useRef<UserActionContext>({
    userId: user.id,
    userName: user.name,
    roomId,
    timestamp: Date.now(),
  });

  const updateContext = useCallback(() => {
    contextRef.current = {
      userId: user.id,
      userName: user.name,
      roomId,
      timestamp: Date.now(),
    };
  }, [user.id, user.name, roomId]);

  const checkJoin = useCallback((): FraudDetectionResult => {
    updateContext();
    const result = service.checkJoinMeeting(contextRef.current);
    setFraudScore(service.getUserScore(user.id));
    setFraudEvents(service.getEvents(user.id));
    setLastCheck(result);
    return result;
  }, [service, updateContext, user.id]);

  const checkLeave = useCallback((): FraudDetectionResult => {
    updateContext();
    const result = service.checkLeaveMeeting(contextRef.current);
    setFraudScore(service.getUserScore(user.id));
    setFraudEvents(service.getEvents(user.id));
    setLastCheck(result);
    return result;
  }, [service, updateContext, user.id]);

  const checkStartCall = useCallback((): FraudDetectionResult => {
    updateContext();
    const result = service.checkStartCall(contextRef.current);
    setFraudScore(service.getUserScore(user.id));
    setFraudEvents(service.getEvents(user.id));
    setIsBlocked(result.blocked);
    setLastCheck(result);
    return result;
  }, [service, updateContext, user.id]);

  const checkScreenShare = useCallback(
    (enabled: boolean): FraudDetectionResult => {
      updateContext();
      const result = service.checkScreenShare(contextRef.current, enabled);
      setFraudScore(service.getUserScore(user.id));
      setFraudEvents(service.getEvents(user.id));
      setLastCheck(result);
      return result;
    },
    [service, updateContext, user.id],
  );

  const checkAccess = useCallback((): ConferenceAccessCheck => {
    const result = service.checkConferenceAccess(
      user.id,
      roomId,
      isHost,
      hostUserId,
    );
    setAccessCheck(result);
    return result;
  }, [service, user.id, roomId, isHost, hostUserId]);

  const checkMeetingBombing = useCallback((): FraudDetectionResult => {
    updateContext();
    const result = service.checkMeetingBombing(contextRef.current);
    setFraudScore(service.getUserScore(user.id));
    setFraudEvents(service.getEvents(user.id));
    setLastCheck(result);
    return result;
  }, [service, updateContext, user.id]);

  const resetScore = useCallback(() => {
    service.resetUserScore(user.id);
    setFraudScore(0);
    setFraudEvents([]);
    setIsBlocked(false);
    setLastCheck(null);
    setAccessCheck(null);
  }, [service, user.id]);

  return {
    fraudScore,
    fraudEvents,
    isBlocked,
    lastCheck,
    accessCheck,
    checkJoin,
    checkLeave,
    checkStartCall,
    checkScreenShare,
    checkAccess,
    checkMeetingBombing,
    resetScore,
  };
}
