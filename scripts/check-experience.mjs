// Node 24's native TypeScript stripping keeps these checks dependency-free.
import assert from 'node:assert/strict';
import { sections } from '../src/app/sections.ts';
import {
  initialExperience,
  isSectionActivation,
  selectActiveSection,
  updateExperience,
} from '../src/app/experience.ts';

assert.deepEqual(
  sections.map(({ id }) => id),
  ['creator', 'projects', 'skills', 'experience', 'contact'],
);
const bounds = [
  { id: 'creator', top: 400, bottom: 600 },
  { id: 'projects', top: 600, bottom: 2200 },
  { id: 'skills', top: 2200, bottom: 2600 },
  { id: 'experience', top: 2600, bottom: 2900 },
  { id: 'contact', top: 2900, bottom: 3100 },
];
const select = (scroll, previous = null, height = 800, distanceToBottom = Infinity) =>
  selectActiveSection(
    bounds.map(({ id, top, bottom }) => ({ id, top: top - scroll, bottom: bottom - scroll })),
    height,
    distanceToBottom,
    previous,
  );
assert.equal(select(0), null, 'introduction owns the reading line');
assert.equal(select(200), 'creator', 'multiple visible sections use the reading line');
assert.equal(select(1200), 'projects', 'a tall section remains active in its middle');
assert.equal(select(381, 'creator'), 'creator', 'small forward boundary jitter is ignored');
assert.equal(select(389, 'creator'), 'projects', 'forward boundary clears tolerance');
assert.equal(select(371, 'projects'), 'projects', 'small reverse boundary jitter is ignored');
assert.equal(select(363, 'projects'), 'creator', 'reverse boundary clears tolerance');
assert.equal(select(2400), 'experience');
assert.equal(select(2500, 'experience', 800, 0), 'contact', 'short bottom section wins');
assert.equal(select(2500, 'contact', 800, 8), 'contact', 'bottom jitter retains Contact');
assert.equal(
  select(2500, 'experience', 800, 8),
  'experience',
  'bottom retention does not activate early',
);
assert.equal(
  select(2500, 'contact', 800, 15),
  'experience',
  'leaving bottom retention resumes reading line',
);
assert.equal(select(3100, 'contact', 800, 0), null, 'footer alone is not Contact');
assert.equal(select(3100, 'contact'), null, 'invisible section cannot be retained');
assert.equal(select(2900, null, 800), null, 'footer at the reading line outside bottom clamp');
assert.equal(select(200, null, 1800), 'projects', 'resize recomputes the reading line');
assert.equal(selectActiveSection([], 800, Infinity, null), null);

const requested = updateExperience(initialExperience, { type: 'navigated', section: 'contact' });
assert.equal(requested.activeSection, null, 'intent does not claim visibility');
assert.deepEqual(requested.lastNavigation, { section: 'contact', sequence: 1 });
const observed = updateExperience(requested, { type: 'observed', section: 'projects' });
assert.equal(
  observed.lastNavigation,
  requested.lastNavigation,
  'intermediate scroll is not intent',
);
assert.equal(updateExperience(observed, { type: 'observed', section: 'projects' }), observed);
const repeated = updateExperience(observed, { type: 'navigated', section: 'contact' });
assert.deepEqual(repeated.lastNavigation, { section: 'contact', sequence: 2 });
const superseded = updateExperience(repeated, { type: 'navigated', section: 'creator' });
assert.deepEqual(superseded.lastNavigation, { section: 'creator', sequence: 3 });
assert.equal(superseded.activeSection, 'projects');
assert.equal(updateExperience(superseded, { type: 'observed', section: null }).activeSection, null);
assert.deepEqual(initialExperience, { activeSection: null, lastNavigation: null });

const activation = {
  defaultPrevented: false,
  button: 0,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  currentTarget: { target: '', hasAttribute: () => false },
};
assert.equal(isSectionActivation(activation), true, 'plain click / keyboard-generated click');
for (const key of ['defaultPrevented', 'altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
  assert.equal(isSectionActivation({ ...activation, [key]: true }), false, key);
}
assert.equal(isSectionActivation({ ...activation, button: 1 }), false);
assert.equal(
  isSectionActivation({
    ...activation,
    currentTarget: { target: '_blank', hasAttribute: () => false },
  }),
  false,
);
assert.equal(
  isSectionActivation({ ...activation, currentTarget: { target: '', hasAttribute: () => true } }),
  false,
);
assert.equal(
  isSectionActivation({
    ...activation,
    currentTarget: { target: '_self', hasAttribute: () => false },
  }),
  true,
);
console.log(
  'PASS registry, selection boundaries, tall/bottom/empty sections, resizing, state identity and intent filtering',
);
