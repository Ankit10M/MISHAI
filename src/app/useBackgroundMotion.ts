import { useEffect, useState } from 'react';
import { observeMotionPolicy } from './observeMotionPolicy';

export function useBackgroundMotion() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');

  useEffect(
    () =>
      observeMotionPolicy((reduced, isVisible) => {
        setReducedMotion(reduced);
        setVisible(isVisible);
      }),
    [],
  );

  return {
    paused,
    reducedMotion,
    visible,
    motionEnabled: !paused && !reducedMotion && visible,
    togglePaused: () => setPaused((value) => !value),
  };
}
