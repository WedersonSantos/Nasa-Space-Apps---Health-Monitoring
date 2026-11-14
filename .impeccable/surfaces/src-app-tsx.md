---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: Vigília dashboard (src/App.tsx)

Mode: Operate. Audience: astronaut in flight (primary), crew medical officer (secondary), Space Apps judges (demo). Job: know within seconds whether health changed, what to do, and why. Constraints: all 7 metrics, alert contract fields, origin on every value, synthetic labelled, state = icon + label + colour, offline (self-hosted fonts), pt-BR copy. Tone pinned by user: mission operations.

## Direction contract

THESIS: Mission time is the spine. Every reading is placed on the mission track and against the crew member's own baseline; the screen refuses the category default of a grey grid of identical KPI cards with one blue accent.

OWN-WORLD: Day mode (user-revised palette): periwinkle ground, white work surfaces, a light lavender mission bar with deep indigo ink, indigo-violet data ink with light blue and purple series. Night mode "Modo noturno": the same indigo-lavender world, dark and desaturated (indigo near-black ground, soft periwinkle data ink). Archivo variable throughout: expanded bold for headings, condensed tabular figures for every telemetry value and the MET clock; system mono only for formulas. Severity colours appear only where they carry state.

STORY: The astronaut reads the annunciator and the vitals strip, sees what to do first, then why and how it was calculated; scrubbing the track shows when each pattern began.

FIRST VIEWPORT: Mission bar (Vigília mark, MET clock D+113 · GMT, crew, Earth link, master annunciator with icon, label and alert count). Below: the mission track full width (pre-flight block, day ticks, onset markers, current-day cursor) with a compact demo strip. Then the seven-cell vitals strip, then the first alert with its action block first.

FORM: Operate shell with the mission track as the signature move (flight-day timeline with onset markers, shared by every chart's time axis); fast cluster drawn as stacked plots on one time axis. seed:09c233d8bff8d21a (the user-pinned mission-operations direction beats the roll)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
