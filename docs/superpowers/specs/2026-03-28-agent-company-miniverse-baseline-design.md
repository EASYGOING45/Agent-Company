# Agent-Company Miniverse Baseline Redesign

Date: 2026-03-28
Project: `Agent-Company`
Status: Draft approved for planning

## Summary

`Agent-Company` will be refactored in two phases. Phase 1 is a learning-driven baseline redesign that makes the project structurally and visually much closer to `ianscott313/miniverse` while preserving the `Agent-Company` project name and the minimum live data path required to show agent presence.

This phase does not aim to preserve the current Wuthering Waves themed presentation. It aims to establish a clean, high-quality baseline that is easier to understand, easier to extend, and visually closer to the original `miniverse`.

## Goals

- Keep the project name `Agent-Company`
- Rebuild the frontend baseline to closely follow `miniverse` structure, page feel, and world-first interaction model
- Preserve the minimum agent data path: `heartbeat + agents`
- Keep the project buildable, runnable, and deployable during the redesign
- Create a cleaner base for future reintroduction of custom themes, richer UI, and additional Agent-Company specific features

## Non-Goals

- Preserve the current Wuthering Waves themed UI as the default Phase 1 experience
- Preserve multi-theme switching as a Phase 1 requirement
- Preserve complex info panels, cards, summaries, or dashboard-heavy UI as part of the new baseline
- Migrate every existing asset into the new baseline immediately
- Deliver a final branded art direction in this phase

## Why This Direction

The current project has drifted away from the strengths of the original reference. It contains more theme-specific packaging and more custom UI, but the result is less visually coherent and harder to evolve. The redesign should first restore the underlying strengths that make `miniverse` work:

- a world-first layout
- a simpler and more unified visual system
- clearer asset organization
- lower UI density
- a cleaner relationship between agent state and world behavior

By resetting to a cleaner baseline first, later theming work can be additive instead of compensating for structural issues.

## Chosen Approach

The project will use a baseline replacement approach inside the existing repository.

- Keep the existing repository, git history, deployment pipeline, and project identity
- Replace the current frontend baseline with a version that is much closer to `miniverse`
- Preserve only the minimum backend/data integration needed for a live agent world
- Treat the current themed UI and specialized assets as deferred material for a later phase

This approach was chosen over incremental patching because the goal is learning through reconstruction, not partial imitation.

## Phase 1 Scope

Phase 1 covers four areas:

### 1. Frontend baseline reset

Rework the main page structure, world container, layout rhythm, styling priorities, and asset usage patterns so the project reads as a `miniverse`-style pixel world rather than a themed dashboard.

### 2. Core world experience

Ensure the world itself is the primary product surface. The page should feel like a coherent pixel environment first, with only minimal supporting UI around it.

### 3. Minimum live data path

Reconnect `heartbeat + agents` to the new world so online presence and basic state changes can still be reflected inside the scene.

### 4. Verification and readiness

Keep local development, build, and deployment working so the baseline can serve as the foundation for later phases.

## Architecture Direction

Phase 1 should simplify the system into a direct path:

`heartbeat -> agent state store -> world citizens -> minimal world UI`

Implications:

- The world is the main interface, not the side panels
- Agent presence should primarily be expressed by citizens in the scene
- Supporting text and UI should exist only to clarify, not compete with the world
- Data flow should be easy to trace from incoming state to rendered in-world behavior

## Repository Strategy

The repository remains `Agent-Company`, but the frontend is treated as a new baseline pass rather than a continuation of the current themed presentation.

### Keep

- repository identity and history
- existing deploy/build setup if still compatible
- minimum agent-related APIs needed for `heartbeat + agents`

### Replace or heavily reshape

- main frontend entry structure
- primary page layout and visual hierarchy
- asset organization where it conflicts with a cleaner baseline
- default world presentation and surrounding UI

### Defer

- Wuthering Waves themed cards and character-heavy presentation
- theme switching
- rich detail panels and summary surfaces
- broad asset migration beyond what is needed for the baseline

## Functional Requirements

Phase 1 must deliver:

- a main page that feels significantly closer to `miniverse`
- a working world view with core citizen/world behavior
- a functioning `heartbeat + agents` path
- enough UI to identify agent presence and state without reintroducing dashboard clutter
- a buildable local project state

## Explicitly Out of Scope

Phase 1 must not expand into:

- redesigning the full long-term brand system
- rebuilding all custom Wuthering Waves content
- introducing more feature modules while the baseline is still unstable
- preserving every current screen or UI artifact for compatibility

## Implementation Sequence

Phase 1 should be executed in this order:

1. Reset the frontend entry and main world presentation toward `miniverse`
2. Re-establish the world and citizen behavior as the primary experience
3. Reconnect `heartbeat + agents` into the new world layer
4. Verify build, local run, and basic live-state behavior

This ordering reduces risk by restoring visual and architectural clarity before reconnecting custom integration.

## Acceptance Criteria

Phase 1 is complete when all of the following are true:

- `Agent-Company` still builds successfully
- the local app runs with the redesigned world-first page
- the page feels materially closer to `miniverse` than to the prior themed version
- at least one agent can appear or update through the `heartbeat + agents` path
- the resulting structure is clean enough to support later theme-specific work

## Risks and Mitigations

### Risk: copying visual structure without improving maintainability

Mitigation: treat this as a baseline reset, not a superficial reskin. Simplify the main data and rendering path as part of the redesign.

### Risk: trying to preserve too much old themed UI

Mitigation: explicitly defer theme-heavy surfaces and keep only the minimum live data path in Phase 1.

### Risk: rebuilding too much backend behavior during the redesign

Mitigation: keep only `heartbeat + agents` as mandatory live integration for this phase.

## Follow-On Phases

After Phase 1, future planning can cover:

- reintroducing `Agent-Company` specific art direction
- selectively migrating current themed assets back into the new baseline
- richer agent interaction surfaces
- advanced panels, summaries, or theme systems

## Open Decisions Already Resolved

- Preserve project name: Yes, keep `Agent-Company`
- Phase 1 priority: both structure and visual quality, in sequence
- Preservation target: keep only the minimum live data path
- Required live integration in Phase 1: `heartbeat + agents`

## Planning Handoff

The next planning step should create an implementation plan for a Phase 1 baseline reset that:

- uses `miniverse` as the primary structural and visual reference
- keeps the project name `Agent-Company`
- preserves `heartbeat + agents`
- deliberately defers themed and dashboard-heavy features
