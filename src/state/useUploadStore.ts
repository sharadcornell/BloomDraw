import { create } from 'zustand';

import type { UploadResultData } from '@/services/upload';

/**
 * Ephemeral hand-off between the Upload screen (which produces variants) and the
 * Variant Selection screen (which renders + saves them). NOT persisted — a draft
 * only lives for the current creation; reopening a saved result reads from the
 * recents store instead.
 */
type UploadState = {
  draft: UploadResultData | null;
  setDraft: (draft: UploadResultData) => void;
  clearDraft: () => void;
};

export const useUploadStore = create<UploadState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
