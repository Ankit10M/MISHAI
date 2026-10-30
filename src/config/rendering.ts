import type { QualityTier } from '../types/world';

/**
 * Rendering configuration — foundation defaults.
 *
 * Centralises render-surface constants so the R3F Canvas boundary stays
 * declarative. These values are intentionally conservative for Phase 4.1 and
 * will later be driven by the adaptive/performance layer rather than hardcoded
 * here (see docs/decisions/performance-strategy.md).
 */

/**
 * Device-pixel-ratio clamp for the renderer. The lower bound is a floor;
 * the upper cap limits excessive rendering cost on high-density displays.
 * R3F reads this as [min, max] and selects a value within the range.
 */
export const DPR_RANGE: [number, number] = [1, 2];

/** Resting background of the void. */
export const WORLD_BACKGROUND = '#05060a';

/** Default quality tier before the adaptive layer has measured the device. */
export const DEFAULT_QUALITY_TIER: QualityTier = 'balanced';
