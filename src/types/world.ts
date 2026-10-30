/**
 * Foundational shared types for the world.
 *
 * Phase 4.1 keeps this intentionally minimal: only types that cross a real
 * boundary *today* live here. World-state, entity, interaction, and
 * orchestration types are introduced by their own phases so this file never
 * becomes a dumping ground.
 */

/**
 * Coarse rendering-quality tiers. The adaptive/performance layer selects a
 * tier from measured device capability; the rendering layer consumes it to
 * scale fidelity. See docs/decisions/performance-strategy.md.
 */
export type QualityTier = 'minimal' | 'balanced' | 'full';
