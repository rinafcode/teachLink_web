import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { VideoAnnotation } from '@/components/video/types';
import { getVideoStorageKey } from '@/utils/videoPlayerUtils';

type UseCollaborativeAnnotationsOptions = {
  videoId: string;
  userId: string;
  userName: string;
};

type AnnotationEvent = {
  roomId: string;
  annotation: VideoAnnotation;
};

const EVENT_NAME = 'video:annotation:add';

export const useCollaborativeAnnotations = ({
  videoId,
  userId,
  userName,
}: UseCollaborativeAnnotationsOptions) => {
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const storageKey = useMemo(() => getVideoStorageKey(videoId, 'annotations'), [videoId]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setAnnotations([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as VideoAnnotation[];
      setAnnotations(parsed);
    } catch {
      setAnnotations([]);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(annotations));
  }, [annotations, storageKey]);

  useEffect(() => {
    const channelName = `video-annotations:${videoId}`;
    channelRef.current = new BroadcastChannel(channelName);
    channelRef.current.onmessage = (event: MessageEvent<AnnotationEvent>) => {
      if (event.data.roomId !== videoId) {
        return;
      }
      setAnnotations((prev) => {
        if (prev.some((item) => item.id === event.data.annotation.id)) {
          return prev;
        }
        return [...prev, event.data.annotation].sort((a, b) => a.time - b.time);
      });
    };
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!url) {
      return;
    }
    const socket = io(url, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('join-room', { roomId: videoId });
    socket.on(EVENT_NAME, (event: AnnotationEvent) => {
      if (event.roomId !== videoId) {
        return;
      }
      setAnnotations((prev) => {
        if (prev.some((item) => item.id === event.annotation.id)) {
          return prev;
        }
        return [...prev, event.annotation].sort((a, b) => a.time - b.time);
      });
    });
    return () => {
      socket.off(EVENT_NAME);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [videoId]);

  const addAnnotation = useCallback(
    (text: string, time: number) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      const annotation: VideoAnnotation = {
        id: crypto.randomUUID(),
        authorId: userId,
        authorName: userName,
        text: trimmed,
        time,
        createdAt: new Date().toISOString(),
      };
      setAnnotations((prev) => [...prev, annotation].sort((a, b) => a.time - b.time));
      const payload: AnnotationEvent = { roomId: videoId, annotation };
      channelRef.current?.postMessage(payload);
      socketRef.current?.emit(EVENT_NAME, payload);
    },
    [userId, userName, videoId],
  );

  return {
    annotations,
    addAnnotation,
  };
};
