import { useEffect, useState } from 'react';

export function useBackgroundMotion() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setVisible(document.visibilityState === 'visible');
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    updatePreference();
    updateVisibility();
    return () => {
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  return {
    paused,
    reducedMotion,
    motionEnabled: !paused && !reducedMotion && visible,
    togglePaused: () => setPaused((value) => !value),
  };
}
