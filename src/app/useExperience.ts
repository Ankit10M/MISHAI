import { useEffect, useReducer } from 'react';
import { initialExperience, selectActiveSection, updateExperience } from './experience';
import { sections, type SectionId } from './sections';

export function useExperience() {
  const [snapshot, dispatch] = useReducer(updateExperience, initialExperience);

  useEffect(() => {
    let frame: number | null = null;
    let disposed = false;
    let selected: SectionId | null = null;
    const elements = sections.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [{ id, element }] : [];
    });

    const measure = () => {
      frame = null;
      if (disposed) return;
      const bounds = elements.map(({ id, element }) => {
        const { top, bottom } = element.getBoundingClientRect();
        return { id, top, bottom };
      });
      const next = selectActiveSection(
        bounds,
        window.innerHeight,
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight,
        selected,
      );
      if (next !== selected) {
        selected = next;
        dispatch({ type: 'observed', section: next });
      }
    };
    const schedule = () => {
      if (!disposed && frame === null) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    for (const { element } of elements) resize.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    window.addEventListener('hashchange', schedule);
    schedule();

    return () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, []);

  const recordNavigation = (section: SectionId) => dispatch({ type: 'navigated', section });
  return { snapshot, recordNavigation };
}
