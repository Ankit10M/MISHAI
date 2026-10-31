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
      <button
        type="button"
        disabled={reducedMotion}
        onClick={onToggle}
        aria-describedby="background-motion-status"
      >
        {reducedMotion
          ? 'Background motion off'
          : paused
            ? 'Resume background motion'
            : 'Pause background motion'}
      </button>
      <span id="background-motion-status">
        {reducedMotion ? 'Off: reduced motion' : paused ? 'Paused' : 'Enabled'}
      </span>
    </div>
  );
}
