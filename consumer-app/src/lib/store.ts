'use client';

import { create } from 'zustand';
import type { Intent, BedFilter, SortOption, AuthMode, Screen } from '@/types';

interface DwellState {
  screen: Screen;
  selectedId: number;
  intent: Intent;
  beds: BedFilter;
  verifiedOnly: boolean;
  sort: SortOption;
  maxPrice: number;
  gallery: number;
  bookingOpen: boolean;
  bookingStep: number;
  slot: string | null;
  note: string;
  saved: Record<number, boolean>;
  activeThread: string;
  msgDraft: string;
  threadMsgs: Record<string, Array<{ me: boolean; text: string; time: string }>>;
  wizStep: number;
  wizType: string;
  wTitle: string;
  wPrice: string;
  wBeds: number;
  wFurnish: string;
  wNeg: boolean;
  authMode: AuthMode;
  authRole: string;
  showPw: boolean;
  searched: boolean;
  loadSaves: () => void;
  // actions
  setScreen: (screen: Screen, selectedId?: number) => void;
  setIntent: (intent: Intent) => void;
  setBeds: (beds: BedFilter) => void;
  setSort: (sort: SortOption) => void;
  setVerifiedOnly: (v: boolean) => void;
  setMaxPrice: (p: number) => void;
  setSearched: (v: boolean) => void;
  toggleSave: (id: number) => void;
  setGallery: (idx: number) => void;
  setBookingOpen: (open: boolean) => void;
  setBookingStep: (step: number) => void;
  setSlot: (slot: string | null) => void;
  setNote: (note: string) => void;
  setActiveThread: (id: string) => void;
  setMsgDraft: (text: string) => void;
  sendMessage: () => void;
  setWizStep: (step: number) => void;
  setWizType: (type: string) => void;
  setWTitle: (t: string) => void;
  setWPrice: (p: string) => void;
  setWBeds: (b: number) => void;
  setWFurnish: (f: string) => void;
  setWNeg: (v: boolean) => void;
  setAuthMode: (m: AuthMode) => void;
  setAuthRole: (r: string) => void;
  setShowPw: (v: boolean) => void;
}

export const useDwellStore = create<DwellState>((set, get) => ({
  screen: 'home',
  selectedId: 1,
  intent: 'rent',
  beds: 'any',
  verifiedOnly: false,
  sort: 'relevance',
  maxPrice: 0,
  gallery: 0,
  bookingOpen: false,
  bookingStep: 1,
  slot: null,
  note: '',
  saved: {},
  activeThread: 't1',
  msgDraft: '',
  threadMsgs: {},
  wizStep: 1,
  wizType: 'rent',
  wTitle: '',
  wPrice: '',
  wBeds: 2,
  wFurnish: 'Unfurnished',
  wNeg: true,
  authMode: 'signin',
  authRole: 'rent',
  showPw: false,
  searched: false,

  loadSaves: () => {
    fetch('/api/saves').then(r => r.json()).then(({ savedIds }: { savedIds: number[] }) => {
      const saved: Record<number, boolean> = {};
      savedIds.forEach(id => { saved[id] = true; });
      set({ saved });
    }).catch(() => {});
  },
  setScreen: (screen, selectedId) => {
    const update: Partial<DwellState> = { screen };
    if (selectedId != null) update.selectedId = selectedId;
    if (screen === 'detail') update.gallery = 0;
    set(update as DwellState);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  },
  setIntent: (intent) => set({ intent }),
  setBeds: (beds) => set({ beds }),
  setSort: (sort) => set({ sort }),
  setVerifiedOnly: (verifiedOnly) => set({ verifiedOnly }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setSearched: (searched) => set({ searched }),
  toggleSave: (id) => {
    const current = get().saved[id];
    set(s => ({ saved: { ...s.saved, [id]: !current } }));
    if (current) {
      fetch(`/api/saves/${id}`, { method: 'DELETE' }).catch(() => {
        set(s => ({ saved: { ...s.saved, [id]: true } }));
      });
    } else {
      fetch('/api/saves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: id }) }).catch(() => {
        set(s => ({ saved: { ...s.saved, [id]: false } }));
      });
    }
  },
  setGallery: (gallery) => set({ gallery }),
  setBookingOpen: (bookingOpen) => set({ bookingOpen, bookingStep: 1, slot: null, note: '' }),
  setBookingStep: (bookingStep) => set({ bookingStep }),
  setSlot: (slot) => set({ slot }),
  setNote: (note) => set({ note }),
  setActiveThread: (activeThread) => set({ activeThread }),
  setMsgDraft: (msgDraft) => set({ msgDraft }),
  sendMessage: () => {
    const { msgDraft, activeThread, threadMsgs } = get();
    const txt = msgDraft.trim();
    if (!txt) return;
    set({
      threadMsgs: {
        ...threadMsgs,
        [activeThread]: [...(threadMsgs[activeThread] || []), { me: true, text: txt, time: 'now' }],
      },
      msgDraft: '',
    });
  },
  setWizStep: (wizStep) => set({ wizStep }),
  setWizType: (wizType) => set({ wizType }),
  setWTitle: (wTitle) => set({ wTitle }),
  setWPrice: (wPrice) => set({ wPrice }),
  setWBeds: (wBeds) => set({ wBeds }),
  setWFurnish: (wFurnish) => set({ wFurnish }),
  setWNeg: (wNeg) => set({ wNeg }),
  setAuthMode: (authMode) => set({ authMode }),
  setAuthRole: (authRole) => set({ authRole }),
  setShowPw: (showPw) => set({ showPw }),
}));
