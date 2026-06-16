import { create } from 'zustand';

import type { PreviewSource } from '@/lib/projector';

/**
 * Ephemeral hand-off for the Projector Preview (docs/02 §7). An entry screen
 * (Drawing Detail / Tutorial / AI Result / Variant Selection / Home) sets the
 * chosen `PreviewSource`, then navigates to `/projector`. NOT persisted and no
 * cloud dependency — the projector screen falls back to a safe default if empty.
 */
type ProjectorState = {
  source: PreviewSource | null;
  setSource: (source: PreviewSource) => void;
  clear: () => void;
};

export const useProjectorStore = create<ProjectorState>((set) => ({
  source: null,
  setSource: (source) => set({ source }),
  clear: () => set({ source: null }),
}));
