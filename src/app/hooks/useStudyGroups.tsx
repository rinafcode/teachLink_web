'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNotificationStore } from '@/app/store/notificationStore';

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: string; // mime
};

export type GroupMessage = {
  id: string;
  groupId: string;
  parentId?: string | null;
  senderId: string;
  senderName: string;
  contentHtml: string; // rich text HTML
  createdAt: string; // ISO
  attachments?: Attachment[];
};

export type ForumCertificateStatus = 'active' | 'expired' | 'revoked';

export type ForumCertificate = {
  id: string;
  groupId: string;
  subjectUserId: string;
  subjectName: string;
  issuerId: string;
  issuerName: string;
  fingerprint: string;
  validFrom: string;
  validUntil: string;
  issuedAt: string;
  revokedAt?: string;
  status: ForumCertificateStatus;
};

export type GroupResource = {
  id: string;
  groupId: string;
  title: string;
  url?: string;
  description?: string;
  type: 'link' | 'file';
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
  groups: 'sl_groups_v1',
  messages: 'sl_group_messages_v1',
  resources: 'sl_group_resources_v1',
  challenges: 'sl_group_challenges_v1',
  certificates: 'sl_group_certificates_v1',
};

function getCertificateStatus(certificate: Pick<ForumCertificate, 'validUntil' | 'revokedAt'>) {
  if (certificate.revokedAt) return 'revoked';
  return new Date(certificate.validUntil).getTime() < Date.now() ? 'expired' : 'active';
}

function normalizeFingerprint(fingerprint: string): string {
  return fingerprint.trim().replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

function assertValidCertificate(input: {
  fingerprint: string;
  validFrom: string;
  validUntil: string;
}) {
  const fingerprint = normalizeFingerprint(input.fingerprint);
  if (!/^[A-F0-9]{64}$/.test(fingerprint)) {
    throw new Error('Certificate fingerprint must be a 64-character SHA-256 hex value.');
  }

  if (new Date(input.validFrom).getTime() >= new Date(input.validUntil).getTime()) {
    throw new Error('Certificate expiry must be after its start date.');
  }

  return fingerprint;
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export type UseStudyGroupsApi = {
  groups: StudyGroup[];
  messages: GroupMessage[];
  resources: GroupResource[];
  challenges: GroupChallenge[];
  certificates: ForumCertificate[];
  currentUser: { id: string; name: string };
  // group
  createGroup: (input: { name: string; description?: string }) => StudyGroup;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  // discussion
  postMessage: (
    groupId: string,
    contentHtml: string,
    attachments?: Attachment[],
    parentId?: string | null,
  ) => GroupMessage;
  issueCertificate: (
    groupId: string,
    certificate: {
      subjectUserId: string;
      subjectName: string;
      fingerprint: string;
      validFrom: string;
      validUntil: string;
    },
  ) => ForumCertificate;
  revokeCertificate: (certificateId: string) => ForumCertificate | undefined;
  groupCertificates: (groupId: string) => ForumCertificate[];
  // resources
  addResource: (
    groupId: string,
    resource: Omit<GroupResource, 'id' | 'groupId' | 'createdAt' | 'addedBy'>,
  ) => GroupResource;
  // challenges
  createChallenge: (
    groupId: string,
    challenge: Omit<GroupChallenge, 'id' | 'groupId' | 'createdAt' | 'progress'>,
  ) => GroupChallenge;
  updateChallengeProgress: (challengeId: string, progress: number) => GroupChallenge | undefined;
  // derived
  groupMessages: (groupId: string) => GroupMessage[];
  groupResources: (groupId: string) => GroupResource[];
  groupChallenges: (groupId: string) => GroupChallenge[];
  challengeLeaderboard: (
    challengeId: string,
  ) => { userId: string; userName: string; progress: number }[];
};

export function useStudyGroups(currentUser?: { id: string; name: string }): UseStudyGroupsApi {
  const [groups, setGroups] = useState<StudyGroup[]>(() =>
    load(STORAGE_KEYS.groups, [] as StudyGroup[]),
  );
  const [messages, setMessages] = useState<GroupMessage[]>(() =>
    load(STORAGE_KEYS.messages, [] as GroupMessage[]),
  );
  const [resources, setResources] = useState<GroupResource[]>(() =>
    load(STORAGE_KEYS.resources, [] as GroupResource[]),
  );
  const [challenges, setChallenges] = useState<GroupChallenge[]>(() =>
    load(STORAGE_KEYS.challenges, [] as GroupChallenge[]),
  );
  const [certificates, setCertificates] = useState<ForumCertificate[]>(() =>
    load(STORAGE_KEYS.certificates, [] as ForumCertificate[]),
  );

  const me = currentUser ?? { id: 'current-user', name: 'You' };

  const persistAll = useCallback(
    (g = groups, m = messages, r = resources, c = challenges, certs = certificates) => {
      save(STORAGE_KEYS.groups, g);
      save(STORAGE_KEYS.messages, m);
      save(STORAGE_KEYS.resources, r);
      save(STORAGE_KEYS.challenges, c);
      save(STORAGE_KEYS.certificates, certs);
    },
    [groups, messages, resources, challenges, certificates],
  );

  // Sync across instances in the same window/process
  useEffect(() => {
    const handleSync = () => {
      setGroups(load(STORAGE_KEYS.groups, []));
      setMessages(load(STORAGE_KEYS.messages, []));
      setResources(load(STORAGE_KEYS.resources, []));
      setChallenges(load(STORAGE_KEYS.challenges, []));
      setCertificates(load(STORAGE_KEYS.certificates, []));
    };

    window.addEventListener('sl_sync', handleSync);
    window.addEventListener('storage', handleSync); // also for other tabs

    return () => {
      window.removeEventListener('sl_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const triggerSync = useCallback(() => {
    window.dispatchEvent(new Event('sl_sync'));
  }, []);

  const createGroup = useCallback<UseStudyGroupsApi['createGroup']>(
    (input) => {
      const group: StudyGroup = {
        id: uid('grp'),
        name: input.name.trim(),
        description: input.description?.trim() || '',
        ownerId: me.id,
        members: [{ id: me.id, name: me.name }],
        createdAt: new Date().toISOString(),
      };
      setGroups((prev) => {
        const next = [group, ...prev];
        save(STORAGE_KEYS.groups, next);
        triggerSync();
        return next;
      });
      // notifications
      try {
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          type: 'success',
          message: `Created group “${group.name}”`,
          meta: { groupId: group.id },
        });
      } catch {}
      toast.success(`Created group “${group.name}”`);
      return group;
    },
    [me.id, me.name, triggerSync],
  );

  const joinGroup = useCallback<UseStudyGroupsApi['joinGroup']>(
    (groupId) => {
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
        triggerSync();
        return next;
      });
      try {
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          type: 'info',
          message: `You joined "${groupName || 'group'}"`,
          meta: { groupId },
        });
      } catch {}
      toast.success('Joined group');
    },
    [me.id, me.name, triggerSync],
  );

  const leaveGroup = useCallback<UseStudyGroupsApi['leaveGroup']>(
    (groupId) => {
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
        triggerSync();
        return next;
      });
      try {
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          type: 'warning',
          message: `You left "${groupName || 'group'}"`,
          meta: { groupId },
        });
      } catch {}
      toast('Left group', { icon: '👋' });
    },
    [me.id, triggerSync],
  );

  const postMessage = useCallback<UseStudyGroupsApi['postMessage']>(
    (groupId, contentHtml, attachments, parentId = null) => {
      const msg: GroupMessage = {
        id: uid('msg'),
        groupId,
        parentId,
        senderId: me.id,
        senderName: me.name,
        contentHtml,
        createdAt: new Date().toISOString(),
        attachments: attachments?.length ? attachments : undefined,
      };
      setMessages((prev) => {
        const next = [...prev, msg];
        save(STORAGE_KEYS.messages, next);
        triggerSync();
        return next;
      });
      try {
        const { addNotification } = useNotificationStore.getState();
        const group = groups.find((g) => g.id === groupId);
        addNotification({
          type: 'info',
          message: `New message in "${group?.name || 'group'}"`,
          meta: { groupId, messageId: msg.id },
        });
      } catch {}
      toast.success('Message posted');
      return msg;
    },
    [me.id, me.name, groups, triggerSync],
  );

  const issueCertificate = useCallback<UseStudyGroupsApi['issueCertificate']>(
    (groupId, input) => {
      const fingerprint = assertValidCertificate(input);
      const duplicateActiveCertificate = certificates.find(
        (certificate) =>
          certificate.groupId === groupId &&
          certificate.fingerprint === fingerprint &&
          getCertificateStatus(certificate) === 'active',
      );

      if (duplicateActiveCertificate) {
        throw new Error('An active certificate with this fingerprint already exists.');
      }

      const certificate: ForumCertificate = {
        id: uid('cert'),
        groupId,
        subjectUserId: input.subjectUserId,
        subjectName: input.subjectName.trim(),
        issuerId: me.id,
        issuerName: me.name,
        fingerprint,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        issuedAt: new Date().toISOString(),
        status: 'active',
      };

      setCertificates((prev) => {
        const next = [certificate, ...prev];
        save(STORAGE_KEYS.certificates, next);
        triggerSync();
        return next;
      });

      return certificate;
    },
    [certificates, me.id, me.name, triggerSync],
  );

  const revokeCertificate = useCallback<UseStudyGroupsApi['revokeCertificate']>(
    (certificateId) => {
      let revoked: ForumCertificate | undefined;
      setCertificates((prev) => {
        const now = new Date().toISOString();
        const next = prev.map((certificate) => {
          if (certificate.id !== certificateId) return certificate;
          revoked = { ...certificate, revokedAt: now, status: 'revoked' };
          return revoked;
        });
        save(STORAGE_KEYS.certificates, next);
        triggerSync();
        return next;
      });
      return revoked;
    },
    [triggerSync],
  );

  const addResource = useCallback<UseStudyGroupsApi['addResource']>(
    (groupId, resource) => {
      const res: GroupResource = {
        id: uid('res'),
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
        triggerSync();
        return next;
      });
      try {
        const { addNotification } = useNotificationStore.getState();
        const group = groups.find((g) => g.id === groupId);
        addNotification({
          type: 'success',
          message: `New resource "${resource.title}" added to "${group?.name || 'group'}"`,
          meta: { groupId, resourceId: res.id },
        });
      } catch {}
      toast.success('Resource added');
      return res;
    },
    [me.id, me.name, groups, triggerSync],
  );

  const createChallenge = useCallback<UseStudyGroupsApi['createChallenge']>(
    (groupId, challenge) => {
      const ch: GroupChallenge = {
        id: uid('chl'),
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
        triggerSync();
        return next;
      });
      try {
        const { addNotification } = useNotificationStore.getState();
        const group = groups.find((g) => g.id === groupId);
        addNotification({
          type: 'success',
          message: `New challenge "${challenge.title}" created in "${group?.name || 'group'}"`,
          meta: { groupId, challengeId: ch.id },
        });
      } catch {}
      toast.success('Challenge created');
      return ch;
    },
    [groups, triggerSync],
  );

  const updateChallengeProgress = useCallback<UseStudyGroupsApi['updateChallengeProgress']>(
    (challengeId, progress) => {
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
        triggerSync();
        return next;
      });
      if (updated) {
        try {
          const { addNotification } = useNotificationStore.getState();
          const group = groups.find((g) => g.id === groupId);
          addNotification({
            type: 'info',
            message: `Progress updated for "${challengeTitle || 'challenge'}" in "${
              group?.name || 'group'
            }"`,
            meta: { challengeId, groupId },
          });
        } catch {}
        toast.success('Progress updated');
      }
      return updated;
    },
    [me.id, me.name, groups, triggerSync],
  );

  const groupMessages = useCallback<UseStudyGroupsApi['groupMessages']>(
    (groupId) => {
      return messages
        .filter((m) => m.groupId === groupId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    [messages],
  );

  const groupResources = useCallback<UseStudyGroupsApi['groupResources']>(
    (groupId) => {
      return resources
        .filter((r) => r.groupId === groupId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [resources],
  );

  const groupChallenges = useCallback<UseStudyGroupsApi['groupChallenges']>(
    (groupId) => {
      return challenges
        .filter((c) => c.groupId === groupId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [challenges],
  );

  const groupCertificates = useCallback<UseStudyGroupsApi['groupCertificates']>(
    (groupId) => {
      return certificates
        .filter((certificate) => certificate.groupId === groupId)
        .map((certificate) => ({
          ...certificate,
          status: getCertificateStatus(certificate),
        }))
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    },
    [certificates],
  );

  const challengeLeaderboard = useCallback<UseStudyGroupsApi['challengeLeaderboard']>(
    (challengeId) => {
      const ch = challenges.find((c) => c.id === challengeId);
      if (!ch) return [];
      return [...ch.progress]
        .sort((a, b) => b.progress - a.progress)
        .map((p) => ({ userId: p.userId, userName: p.userName, progress: p.progress }));
    },
    [challenges],
  );

  // Persist when state changes (robust against batch updates via persistAll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => persistAll(), [groups, messages, resources, challenges, certificates, persistAll]);

  return {
    groups,
    messages,
    resources,
    challenges,
    certificates,
    currentUser: me,
    createGroup,
    joinGroup,
    leaveGroup,
    postMessage,
    issueCertificate,
    revokeCertificate,
    groupCertificates,
    addResource,
    createChallenge,
    updateChallengeProgress,
    groupMessages,
    groupResources,
    groupChallenges,
    challengeLeaderboard,
  };
}
