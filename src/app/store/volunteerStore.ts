import { create } from 'zustand';
import type { Volunteer, VolunteerSMSPreferences } from '@/types/volunteer';

const STORAGE_KEY = 'volunteers_v1';

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
  } catch {}
}

interface VolunteerState {
  volunteers: Volunteer[];
  addVolunteer: (v: Omit<Volunteer, 'id' | 'joinedAt'>) => Volunteer;
  updateVolunteer: (id: string, patch: Partial<Omit<Volunteer, 'id'>>) => void;
  removeVolunteer: (id: string) => void;
  updateSMSPreferences: (id: string, sms: Partial<VolunteerSMSPreferences>) => void;
}

export const useVolunteerStore = create<VolunteerState>((set, get) => ({
  volunteers: load<Volunteer[]>(STORAGE_KEY, []),

  addVolunteer: (v) => {
    const volunteer: Volunteer = {
      ...v,
      id: `vol_${Math.random().toString(36).slice(2)}_${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };
    const next = [...get().volunteers, volunteer];
    set({ volunteers: next });
    save(STORAGE_KEY, next);
    return volunteer;
  },

  updateVolunteer: (id, patch) => {
    const next = get().volunteers.map((v) => (v.id === id ? { ...v, ...patch } : v));
    set({ volunteers: next });
    save(STORAGE_KEY, next);
  },

  removeVolunteer: (id) => {
    const next = get().volunteers.filter((v) => v.id !== id);
    set({ volunteers: next });
    save(STORAGE_KEY, next);
  },

  updateSMSPreferences: (id, sms) => {
    const next = get().volunteers.map((v) =>
      v.id === id ? { ...v, sms: { ...v.sms, ...sms } } : v,
    );
    set({ volunteers: next });
    save(STORAGE_KEY, next);
  },
}));
