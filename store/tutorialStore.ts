import { create } from 'zustand';

export type TutorialStage = 'idle' | 'ask' | 'paste-link' | 'tap-category' | 'pick-category' | 'done';

interface TutorialStore {
  stage: TutorialStage;
  sampleLinkId: string | null;
  setStage: (stage: TutorialStage) => void;
  setSampleLinkId: (id: string | null) => void;
  reset: () => void;
}

export const useTutorialStore = create<TutorialStore>((set) => ({
  stage: 'idle',
  sampleLinkId: null,
  setStage: (stage) => set({ stage }),
  setSampleLinkId: (sampleLinkId) => set({ sampleLinkId }),
  reset: () => set({ stage: 'idle', sampleLinkId: null }),
}));
