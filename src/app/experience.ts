import type { SectionId } from './sections.ts';

export type ExperienceSnapshot = Readonly<{
  activeSection: SectionId | null;
  lastNavigation: Readonly<{ section: SectionId; sequence: number }> | null;
}>;

export const initialExperience: ExperienceSnapshot = {
  activeSection: null,
  lastNavigation: null,
};

export type ExperienceEvent =
  { type: 'observed'; section: SectionId | null } | { type: 'navigated'; section: SectionId };

export function updateExperience(
  state: ExperienceSnapshot,
  event: ExperienceEvent,
): ExperienceSnapshot {
  if (event.type === 'observed') {
    return state.activeSection === event.section
      ? state
      : { ...state, activeSection: event.section };
  }
  return {
    ...state,
    lastNavigation: { section: event.section, sequence: (state.lastNavigation?.sequence ?? 0) + 1 },
  };
}

type SectionBounds = Readonly<{ id: SectionId; top: number; bottom: number }>;

// Provisional reading line and hysteresis; see the Phase 4.3 report for edge cases.
export function selectActiveSection(
  bounds: readonly SectionBounds[],
  viewportHeight: number,
  distanceToBottom: number,
  previous: SectionId | null,
): SectionId | null {
  const visible = bounds.filter(({ top, bottom }) => top < viewportHeight && bottom > 0);
  const lastVisible = visible.at(-1)?.id ?? null;
  if (distanceToBottom <= 2 || (previous === lastVisible && distanceToBottom <= 14)) {
    return lastVisible;
  }

  const line = viewportHeight * 0.28;
  const current = visible.find(({ id }) => id === previous);
  if (current && current.top <= line + 12 && current.bottom > line - 12) return current.id;
  return visible.find(({ top, bottom }) => top <= line && bottom > line)?.id ?? null;
}

export function isSectionActivation(event: {
  defaultPrevented: boolean;
  button: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  currentTarget: { target: string; hasAttribute: (name: string) => boolean };
}): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    (!event.currentTarget.target || event.currentTarget.target === '_self') &&
    !event.currentTarget.hasAttribute('download')
  );
}
