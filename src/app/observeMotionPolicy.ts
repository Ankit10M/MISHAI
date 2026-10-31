export function observeMotionPolicy(update: (reducedMotion: boolean, visible: boolean) => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const read = () => update(preference.matches, document.visibilityState === 'visible');
  preference.addEventListener('change', read);
  document.addEventListener('visibilitychange', read);
  read();
  return () => {
    preference.removeEventListener('change', read);
    document.removeEventListener('visibilitychange', read);
  };
}
