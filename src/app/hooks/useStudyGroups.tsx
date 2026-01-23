"use client";

import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNotificationStore } from "@/app/store/notificationStore";

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: string; // mime
};

export type GroupMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  contentHtml: string; // rich text HTML
  createdAt: string; // ISO
  attachments?: Attachment[];
};

export type GroupResource = {
  id: string;
  groupId: string;
  title: string;
  url?: string;
  description?: string;
  type: "link" | "file";
  addedBy: { id: string; name: string };
  createdAt: string;
};

export type ChallengeProgress = {
  userId: string;
  userName: string;
  progress: number; // 0..100
  updatedAt: string;
};

export type GroupChallenge = {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  startDate: string; // ISO
  endDate: string; // ISO
  target: number; // arbitrary points or tasks
  progress: ChallengeProgress[];
  createdAt: string;
};

export type StudyGroup = {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  ownerId: string;
  members: { id: string; name: string }[];
  createdAt: string;
};

const STORAGE_KEYS = {
  groups: "sl_groups_v1",
  messages: "sl_group_messages_v1",
  resources: "sl_group_resources_v1",
  challenges: "sl_group_challenges_v1",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export type UseStudyGroupsApi = {
  groups: StudyGroup[];
  messages: GroupMessage[];
  resources: GroupResource[];
  challenges: GroupChallenge[];
  currentUser: { id: string; name: string };
  // group
  createGroup: (input: { name: string; description?: string }) => StudyGroup;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  // discussion
  postMessage: (
    groupId: string,
    contentHtml: string,
    attachments?: Attachment[]
  ) => GroupMessage;
  // resources
  addResource: (
    groupId: string,
    resource: Omit<GroupResource, "id" | "groupId" | "createdAt" | "addedBy">
  ) => GroupResource;
  // challenges
  createChallenge: (
    groupId: string,
    challenge: Omit<GroupChallenge, "id" | "groupId" | "createdAt" | "progress">
  ) => GroupChallenge;
  updateChallengeProgress: (
    challengeId: string,
    progress: number
  ) => GroupChallenge | undefined;
  // derived
  groupMessages: (groupId: string) => GroupMessage[];
  groupResources: (groupId: string) => GroupResource[];
  groupChallenges: (groupId: string) => GroupChallenge[];
  challengeLeaderboard: (
    challengeId: string
  ) => { userId: string; userName: string; progress: number }[];
};

export function useStudyGroups(currentUser?: { id: string; name: string }): UseStudyGroupsApi {
  const [groups, setGroups] = useState<StudyGroup[]>(() => load(STORAGE_KEYS.groups, [] as StudyGroup[]));
  const [messages, setMessages] = useState<GroupMessage[]>(() => load(STORAGE_KEYS.messages, [] as GroupMessage[]));
  const [resources, setResources] = useState<GroupResource[]>(() => load(STORAGE_KEYS.resources, [] as GroupResource[]));
  const [challenges, setChallenges] = useState<GroupChallenge[]>(() => load(STORAGE_KEYS.challenges, [] as GroupChallenge[]));

  const me = currentUser ?? { id: "current-user", name: "You" };

  const persistAll = useCallback(
    (g = groups, m = messages, r = resources, c = challenges) => {
      save(STORAGE_KEYS.groups, g);
      save(STORAGE_KEYS.messages, m);
      save(STORAGE_KEYS.resources, r);
      save(STORAGE_KEYS.challenges, c);
    },
    [groups, messages, resources, challenges]
  );

  const createGroup = useCallback<UseStudyGroupsApi["createGroup"]>((input) => {
    const group: StudyGroup = {
      id: uid("grp"),
      name: input.name.trim(),
      description: input.description?.trim() || "",
      ownerId: me.id,
      members: [{ id: me.id, name: me.name }],
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => {
      const next = [group, ...prev];
      save(STORAGE_KEYS.groups, next);
      return next;
    });
    // notifications
    try {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ type: 'success', message: `Created group “${group.name}”`, meta: { groupId: group.id } });
    } catch {}
    toast.success(`Created group “${group.name}”`);
    return group;
  }, [me.id, me.name]);

  const joinGroup = useCallback<UseStudyGroupsApi["joinGroup"]>((groupId) => {
    let groupName: string | undefined;
    setGroups((prev) => {
      const next = prev.map((g) => {
        if (g.id === groupId && !g.members.some((m) => m.id === me.id)) {
          groupName = g.name;
          return { ...g, members: [...g.members, { id: me.id, name: me.name }] };
        }
        return g;
      });
      save(STORAGE_KEYS.groups, next);
      return next;
    });
    try {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ 
        type: 'info', 
        message: `You joined "${groupName || 'group'}"`, 
        meta: { groupId } 
      });
    } catch {}
    toast.success("Joined group");
  }, [me.id, me.name]);

  const leaveGroup = useCallback<UseStudyGroupsApi["leaveGroup"]>((groupId) => {
    let groupName: string | undefined;
    setGroups((prev) => {
      const next = prev.map((g) => {
        if (g.id === groupId) {
          groupName = g.name;
          return { ...g, members: g.members.filter((m) => m.id !== me.id) };
        }
        return g;
      });
      save(STORAGE_KEYS.groups, next);
      return next;
    });
    try {
      const { addNotification } = useNotificationStore.getState();
      addNotification({ 
        type: 'warning', 
        message: `You left "${groupName || 'group'}"`, 
        meta: { groupId } 
      });
    } catch {}
    toast("Left group", { icon: "👋" });
  }, [me.id]);

  const postMessage = useCallback<UseStudyGroupsApi["postMessage"]>((groupId, contentHtml, attachments) => {
    const msg: GroupMessage = {
      id: uid("msg"),
      groupId,
      senderId: me.id,
      senderName: me.name,
      contentHtml,
      createdAt: new Date().toISOString(),
      attachments: attachments?.length ? attachments : undefined,
    };
    setMessages((prev) => {
      const next = [...prev, msg];
      save(STORAGE_KEYS.messages, next);
      return next;
    });
    try {
      const { addNotification } = useNotificationStore.getState();
      const group = groups.find(g => g.id === groupId);
      addNotification({ 
        type: 'info', 
        message: `New message in "${group?.name || 'group'}"`, 
        meta: { groupId, messageId: msg.id } 
      });
    } catch {}
    toast.success("Message posted");
    return msg;
  }, [me.id, me.name, groups]);

  const addResource = useCallback<UseStudyGroupsApi["addResource"]>((groupId, resource) => {
    const res: GroupResource = {
      id: uid("res"),
      groupId,
      title: resource.title,
      url: resource.url,
      description: resource.description,
      type: resource.type,
      addedBy: { id: me.id, name: me.name },
      createdAt: new Date().toISOString(),
    };
    setResources((prev) => {
      const next = [res, ...prev];
      save(STORAGE_KEYS.resources, next);
      return next;
    });
    try {
      const { addNotification } = useNotificationStore.getState();
      const group = groups.find(g => g.id === groupId);
      addNotification({ 
        type: 'success', 
        message: `New resource "${resource.title}" added to "${group?.name || 'group'}"`, 
        meta: { groupId, resourceId: res.id } 
      });
    } catch {}
    toast.success("Resource added");
    return res;
  }, [me.id, me.name, groups]);

  const createChallenge = useCallback<UseStudyGroupsApi["createChallenge"]>((groupId, challenge) => {
    const ch: GroupChallenge = {
      id: uid("chl"),
      groupId,
      title: challenge.title,
      description: challenge.description,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      target: challenge.target,
      progress: [],
      createdAt: new Date().toISOString(),
    };
    setChallenges((prev) => {
      const next = [ch, ...prev];
      save(STORAGE_KEYS.challenges, next);
      return next;
    });
    try {
      const { addNotification } = useNotificationStore.getState();
      const group = groups.find(g => g.id === groupId);
      addNotification({ 
        type: 'success', 
        message: `New challenge "${challenge.title}" created in "${group?.name || 'group'}"`, 
        meta: { groupId, challengeId: ch.id } 
      });
    } catch {}
    toast.success("Challenge created");
    return ch;
  }, [groups]);

  const updateChallengeProgress = useCallback<UseStudyGroupsApi["updateChallengeProgress"]>((challengeId, progress) => {
    let updated: GroupChallenge | undefined;
    let challengeTitle: string | undefined;
    let groupId: string | undefined;
    setChallenges((prev) => {
      const next = prev.map((c) => {
        if (c.id !== challengeId) return c;
        challengeTitle = c.title;
        groupId = c.groupId;
        const existing = c.progress.find((p) => p.userId === me.id);
        const now = new Date().toISOString();
        const updatedProgress: ChallengeProgress = {
          userId: me.id,
          userName: me.name,
          progress: Math.max(0, Math.min(100, progress)),
          updatedAt: now,
        };
        const newProgress = existing
          ? c.progress.map((p) => (p.userId === me.id ? updatedProgress : p))
          : [...c.progress, updatedProgress];
        updated = { ...c, progress: newProgress };
        return updated;
      });
      save(STORAGE_KEYS.challenges, next);
      return next;
    });
    if (updated) {
      try {
        const { addNotification } = useNotificationStore.getState();
        const group = groups.find(g => g.id === groupId);
        addNotification({ 
          type: 'info', 
          message: `Progress updated for "${challengeTitle || 'challenge'}" in "${group?.name || 'group'}"`, 
          meta: { challengeId, groupId } 
        });
      } catch {}
      toast.success("Progress updated");
    }
    return updated;
  }, [me.id, me.name, groups]);

  const groupMessages = useCallback<UseStudyGroupsApi["groupMessages"]>((groupId) => {
    return messages
      .filter((m) => m.groupId === groupId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [messages]);

  const groupResources = useCallback<UseStudyGroupsApi["groupResources"]>((groupId) => {
    return resources
      .filter((r) => r.groupId === groupId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [resources]);

  const groupChallenges = useCallback<UseStudyGroupsApi["groupChallenges"]>((groupId) => {
    return challenges
      .filter((c) => c.groupId === groupId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [challenges]);

  const challengeLeaderboard = useCallback<UseStudyGroupsApi["challengeLeaderboard"]>((challengeId) => {
    const ch = challenges.find((c) => c.id === challengeId);
    if (!ch) return [];
    return [...ch.progress]
      .sort((a, b) => b.progress - a.progress)
      .map((p) => ({ userId: p.userId, userName: p.userName, progress: p.progress }));
  }, [challenges]);

  // Persist when state changes (robust against batch updates via persistAll)
  useMemo(() => persistAll(), [groups, messages, resources, challenges, persistAll]);

  return {
    groups,
    messages,
    resources,
    challenges,
    currentUser: me,
    createGroup,
    joinGroup,
    leaveGroup,
    postMessage,
    addResource,
    createChallenge,
    updateChallengeProgress,
    groupMessages,
    groupResources,
    groupChallenges,
    challengeLeaderboard,
  };
}
