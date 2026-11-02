export function BackgroundMotionControl({
  paused,
  reducedMotion,
  onToggle,
}: {
  paused: boolean;
  reducedMotion: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="background-motion-control">
      <button type="button" onClick={onToggle} aria-describedby="background-motion-status">
        {paused ? 'Resume visual motion' : 'Pause visual motion'}
      </button>
      <span id="background-motion-status">
        {paused
          ? 'Paused: background and Creator head'
          : reducedMotion
            ? 'Reduced motion: background off; Creator head changes immediately'
            : 'Enabled: background and Creator head'}
      </span>
    </div>
  );
}
