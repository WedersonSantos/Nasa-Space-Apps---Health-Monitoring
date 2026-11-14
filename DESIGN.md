---
name: Vigília
description: Mission-operations health console for astronauts, placed on mission time and against each crew member's own baseline.
colors:
  ground: "#eef0fa"
  surface: "#ffffff"
  surface-2: "#f5f5fd"
  ink: "#1e1b3a"
  muted: "#55557a"
  border: "#d6d8ef"
  hairline: "#e6e7f6"
  grid: "#e7e8f5"
  shell: "#e4e3fa"
  shell-2: "#d5d4f5"
  shell-line: "#c0bfeb"
  shell-ink: "#23204a"
  shell-muted: "#5c5a88"
  shell-normal: "#1d8754"
  shell-attention: "#b06200"
  shell-critical: "#c2342a"
  indigo: "#5b55d6"
  series-blue: "#3a7fc4"
  series-purple: "#9a63d4"
  band: "rgba(91, 85, 214, 0.11)"
  preflight: "rgba(30, 27, 58, 0.06)"
  normal: "#17784a"
  normal-bg: "#e1f1e7"
  attention: "#995700"
  attention-bg: "#fbeed6"
  critical: "#b3261e"
  critical-bg: "#fbe5e2"
  on-sev: "#ffffff"
  on-annunciator: "#ffffff"
  night-ground: "#120f0b"
  night-surface: "#1b1712"
  night-surface-2: "#231e17"
  night-ink: "#f1e5d3"
  night-muted: "#bba98f"
  night-border: "#3b3229"
  night-hairline: "#2d261f"
  night-grid: "#2a231c"
  night-shell: "#0a0806"
  night-shell-2: "#17120d"
  night-shell-line: "#2e261d"
  night-shell-muted: "#a8967d"
  night-sand: "#ead9bd"
  night-series-sage: "#9dc0a4"
  night-series-rose: "#d8a4aa"
  night-band: "rgba(234, 217, 189, 0.1)"
  night-preflight: "rgba(241, 229, 211, 0.05)"
  night-normal: "#7ccb97"
  night-attention: "#f2b552"
  night-critical: "#ff8a7a"
typography:
  wordmark:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 800
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 125"
  annunciator:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.03em"
    fontVariation: "'wdth' 115"
  headline:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.2
    fontVariation: "'wdth' 115"
  title:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.2
    fontVariation: "'wdth' 115"
  body:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  telemetry-xl:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 75"
  telemetry:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 75"
  telemetry-small:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 82"
  formula:
    fontFamily: "ui-monospace, Cascadia Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "0.85rem"
    lineHeight: 1.6
rounded:
  sm: "3px"
  md: "6px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
    height: "40px"
  console-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "3px 10px 3px 4px"
    height: "30px"
  console-button-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  shell-button:
    backgroundColor: "{colors.shell-2}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "34px"
  shell-button-pressed:
    backgroundColor: "{colors.shell-ink}"
    textColor: "{colors.shell}"
  annunciator-normal:
    backgroundColor: "{colors.shell-normal}"
    textColor: "{colors.on-annunciator}"
    typography: "{typography.annunciator}"
    rounded: "{rounded.md}"
    padding: "8px 18px 8px 14px"
  annunciator-attention:
    backgroundColor: "{colors.shell-attention}"
    textColor: "{colors.on-annunciator}"
  annunciator-critical:
    backgroundColor: "{colors.shell-critical}"
    textColor: "{colors.on-annunciator}"
  annunciator-unassessed:
    backgroundColor: "{colors.shell-2}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.md}"
  severity-badge-normal:
    backgroundColor: "{colors.normal-bg}"
    textColor: "{colors.normal}"
    rounded: "{rounded.md}"
    padding: "3px 10px 3px 7px"
  severity-badge-attention:
    backgroundColor: "{colors.attention-bg}"
    textColor: "{colors.attention}"
    rounded: "{rounded.md}"
    padding: "3px 10px 3px 7px"
  severity-badge-critical:
    backgroundColor: "{colors.critical-bg}"
    textColor: "{colors.critical}"
    rounded: "{rounded.md}"
    padding: "3px 10px 3px 7px"
  severity-badge-unassessed:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "3px 10px 3px 7px"
  button-small:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "30px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
  tab:
    textColor: "{colors.muted}"
    padding: "10px 16px"
  tab-selected:
    textColor: "{colors.ink}"
---

# Design System: Vigília

## Overview

**Creative North Star: "The Mission Clock"**

Vigília looks like a station console, not a SaaS dashboard. Mission time is the spine: a pale lavender shell carries the wordmark, the MET clock (`D+113 · GMT`), the crew and the master annunciator, and directly under it the mission track lays every flight day on one horizontal lane. Everything below (vitals strip, alerts, indicator clusters) is read against that clock and against the crew member's own baseline.

The world has two lighting conditions, taken from the station itself. **Day mode** is the module's general illumination, read in light tones between purple and blue: a periwinkle-tinted ground, white work surfaces, a lavender shell inked in deep indigo, indigo-violet data ink. **Night mode, "pré-sono"**, is the low-blue pre-sleep lighting: warm near-black, sand-white ink, and no blue anywhere, including focus rings, links and chart series. Density is operational: compact cells, tabular figures, hairline dividers, and one loud element (the annunciator) per screen.

Type is a single variable family stretched across its width axis: expanded bold for things you name, condensed tabular figures for things you measure. Severity colour is reserved for state; it never decorates.

**Key Characteristics:**
- Lavender mission shell (near-black warm shell at night) with MET clock and master annunciator, full width, above everything.
- The mission track (flight-day lane with onset markers and a day cursor) as the signature move.
- Archivo Variable only, used along its width axis: 115–125% for headings, 75–82% for telemetry.
- State is always icon + label + colour, including the honest fourth state, "Não avaliado", when the engine lacks data.
- Two physically motivated palettes: light periwinkle-and-lavender module light by day, blue-free pre-sleep light by night.

## Colors

A light instrument palette between purple and blue by day and a warm, blue-free one by night; each has its own shell band (pale lavender by day, near-black by night) and holds severity hues back for state.

### Primary
- **Indigo Data Ink** (`indigo`, CSS `--series-1` and `--focus`): the day-mode data colour. First chart series, links, selected tab underline, checked scale option, primary button (white text, 5.65:1), focus ring, caret, text selection, the alert "O que fazer" sub-heading, the how-to-measure title, and the brand mark. In night mode its role passes to **Pre-sleep Sand** (`night-sand`), which takes every one of those jobs so no blue survives after dark.

### Secondary
- **Lavender Shell** (`shell`, `shell-2`, `shell-line`): the mission bar and track band, a shade deeper than the ground; raised controls sit on `shell-2`, dividers and the pre-flight hatch on `shell-line`. Text on the shell is **Shell Indigo** (`shell-ink`) with `shell-muted` for secondary readouts (5.09:1). Night equivalents: `night-shell`, `night-shell-2`, `night-shell-line`, `night-shell-muted`; shell ink becomes `night-ink`.
- **Shell annunciator lamps** (`shell-normal`, `shell-attention`, `shell-critical`): deep severity hues tuned for the light shell, solid enough to carry white text (`on-annunciator`, 4.52–5.5:1). Used only for the annunciator fill, the track's day bars, onset markers and legend icon; as graphics on the shell they hold at least 3:1. At night they take the night severity hues and `on-annunciator` becomes `night-shell`.

### Tertiary
- **Series Light Blue / Series Purple** (`series-blue`, `series-purple`): second and third chart series by day, flanking indigo on either side of the purple-blue axis. At night they become **Sage** (`night-series-sage`) and **Dusty Rose** (`night-series-rose`).
- **Baseline band and pre-flight wash** (`band`, `preflight`): the individual baseline band is translucent indigo (`night-band`, translucent sand, after dark); pre-flight days in charts get a faint ink wash (`preflight` / `night-preflight`). Chart grid lines use `grid` / `night-grid`.

### Severity
- **Normal** (`normal` on `normal-bg`), **Atenção** (`attention` on `attention-bg`), **Crítico** (`critical` on `critical-bg`). Text on solid severity fills uses `on-sev` (white by day, `night-ground` by night). At night the severity hues are `night-normal`, `night-attention`, `night-critical` over the same hue at 12–13% alpha.

### Neutral
- **Periwinkle Mist** (`ground`): page ground by day; `night-ground` at night.
- **Work Surface** (`surface`, `surface-2`): cards, panels, alert bodies; `surface-2` for card heads, inputs, formula blocks. Night: `night-surface`, `night-surface-2`.
- **Indigo Ink** (`ink`) and **Muted Indigo** (`muted`): body text and secondary text. Night: `night-ink` (sand-white) and `night-muted`.
- **Border / Hairline** (`border`, `hairline`): container strokes and internal dividers. Night: `night-border`, `night-hairline`.

### Named Rules
**The Severity Is State Rule.** Green, amber and red appear only where they carry a severity state (annunciator, badges, track bars, tinted vital cells, alert borders, tab counts, adherence fill, the urgent follow-up button, logged-action checks). Never as decoration or brand accent; the brand mark is data ink, not a lamp.

**The No Blue After Dark Rule.** In "pré-sono" mode no token resolves to a blue hue. Every role indigo plays by day is played by sand at night, and the day series' light blue becomes sage.

## Typography

**Display Font:** Archivo Variable (weight 100–900, width 62–125%), self-hosted via `@fontsource-variable/archivo/wdth.css`, fallback Segoe UI, system-ui, sans-serif
**Body Font:** Archivo Variable at normal width
**Mono Font:** system mono stack (ui-monospace, Cascadia Mono, Consolas), formulas only

**Character:** One family, two voices. Expanded and bold, it names things like a placard; condensed with tabular figures, it reads like a telemetry display.

### Hierarchy
- **Wordmark** (800, 1.35rem, width 125%, uppercase, 0.04em): "Vigília" in the mission bar only.
- **Annunciator** (800, 1.3rem, width 115%, uppercase, 0.03em): the master state label ("Normal", "Atenção", "Crítico") with a 0.82rem/600 sub-line ("2 alertas ativos · ver o que fazer").
- **Headline** (700, 1.15–1.35rem, width 115%, line-height 1.2, balanced wrap): alert titles, section titles, panel h2.
- **Title** (700, 0.95–1.05rem, width 115%): cluster and indicator headings, the track title (uppercase, 0.05em).
- **Body** (400, 16px, line-height 1.5; 17px at ≥1600px): explanations capped at 62–75ch; alert guidance at 1.08rem/500, 68ch.
- **Label** (600–700, 0.68–0.75rem, uppercase, 0.05–0.06em): table heads, crew `dt`, alert sub-headings ("O que fazer"), origin badges, track legend.
- **Telemetry** (700, width 75%, tabular): MET day 2rem, indicator value 2.2rem (3rem for adherence), vital value 1.6rem; units drop to 0.8–0.95rem/500 at width 100% in muted ink.
- **Telemetry small** (width 82% via `--narrow`, tabular): clock, deltas, track ticks, chart axis text, data-table numbers, kbd.
- **Formula** (mono, 0.85rem, line-height 1.6): the arithmetic block of an alert, nothing else.

### Named Rules
**The Stretch Means Role Rule.** Width encodes meaning: expanded (`--wide`, 115%; 125% for the wordmark) for names and headings, condensed (75% or `--narrow`, 82%) with tabular numerals for every measured value. Body copy stays at 100%.

**The Mono Is Math Rule.** Monospace appears only in the arithmetic block that shows how an alert was calculated.

## Layout

A single centred column, max-width 1360px with 24px gutters (16px under 640px), shared by the mission bar, the track and the page so their left edges align. The shell (mission bar + track) runs full-bleed in the shell colour; content sits on the ground below it.

Vertical order: mission bar, mission track, demo strip ("Demonstração"), seven-cell vitals strip, tabs, then the tab's stack (32px between groups, 16px within). Two-up grids (`grid-2`, entry forms, side-by-side countermeasure charts) use 16–20px gaps. Indicator rows pair a 250–310px meta column with a full-width chart. Spacing steps: 4, 8, 12, 16, 24, 32px; 40px closes the page.

Responsive breakpoints:
- **≤1280px:** the demo note hides, the theme button collapses to its icon (text kept for screen readers), mission-bar gaps tighten.
- **≤1180px:** keyboard-shortcut hints hide; the alert's "why / how calculated" two-column block stacks.
- **≤900px:** the vitals strip re-flows to 4 + 3 cells on a 12-column grid; the annunciator takes a full-width row; all two-up grids and indicator rows go single column; track controls lose their auto margin.
- **≤640px:** gutters drop to 16px; vitals become 2 columns with the last cell spanning; panel and alert padding tighten to 14px; form rows stack.
- **≥1600px:** body text rises to 17px.

Every grid child carries `min-width: 0`; wide tables scroll inside their own container instead of the page.

## Elevation & Depth

Mostly flat with tonal layering: the lavender shell band, the periwinkle ground and white surfaces do most of the separation, and every container also carries a 1px border. One soft ambient shadow, tinted indigo by day, lifts working surfaces; floating layers get a deeper neutral one.

### Shadow Vocabulary
- **Surface lift** (`--shadow`; day `0 1px 2px rgba(30,27,58,.06), 0 4px 14px -6px rgba(60,55,140,.16)`, night `0 1px 2px rgba(0,0,0,.4), 0 6px 18px -8px rgba(0,0,0,.6)`): cards, panels, alerts, clusters, the vitals strip.
- **Chart tooltip** (`0 8px 24px -8px rgba(0,0,0,.3)`): the recharts tooltip.
- **Term popover** (`0 12px 32px -10px rgba(0,0,0,.35)`): the variable explanation popover.
- **Annunciator ring** (animated `box-shadow` from `0 0 0 0` severity ring to `0 0 0 16px transparent`): motion only, see Components.

### Named Rules
**The Border Carries the Edge Rule.** Every surface has a 1px border; shadows are soft and ambient, never offset or hard.

## Shapes

Gently squared corners: 6px (`rounded.md`) for every container, button, input, badge and the annunciator; 3px (`rounded.sm`) for small console pieces (demo buttons, origin badges, class chips, tags, kbd, focus rings). The only pill is the tab count. The only circles are the track's onset markers and cursor knob.

Borders carry meaning. Severity raises border weight (attention: 1px amber; critical: 2px red). Data origin is encoded in stroke style: "Medido" solid ink, "Sintético" dashed, "Estimado" dotted. The accumulator class chip uses a 3px double border. Pre-flight days on the track and the pre-flight progress steps are a 135° hatch (3px line, 4px gap). "Não avaliado" is drawn dashed everywhere: the badge, the unassessed annunciator (2px), the coverage note and the partial-clear box. Logged actions are 8px diamonds (a square rotated 45°). The action follow-up block opens with a dashed top rule. Keys (`kbd`) have a 2px bottom border.

## Components

### Mission Bar
The console header. Wordmark with an indigo (`series-1`; sand at night) mark, MET clock (condensed tabular day plus muted GMT clock), crew `dl`, Earth link, theme toggle ("modo dia" / "modo pré-sono (luz sem azul)", `aria-pressed`), and the master annunciator last. Flex-wraps; focus rings inside the shell switch to `shell-ink`.

### Master Annunciator
- **Shape:** 6px block, 8px 18px 8px 14px padding, fill = shell lamp colour for the overall state, text in `on-annunciator` (white by day).
- **Content:** severity icon (26px) + uppercase expanded label + sub-line with alert count (plus "· N não avaliados" when coverage is partial) or "Nenhum alerta ativo".
- **Unassessed variant:** with no alerts but some signals not evaluable, it reads "Avaliação parcial" ("Sem alertas · N de 7 sinais não avaliados"), or "Sem dados" when none could be evaluated; `shell-2` fill, `shell-ink` text, 2px dashed `shell-muted` border, Unknown icon. Missing data is never shown as a calm green.
- **States:** with alerts it is a link that jumps to the first alert's action ("ver o que fazer"); hover brightens 6%; focus ring `shell-ink`, 3px offset.
- **Motion:** one 0.9s `cubic-bezier(0.16, 1, 0.3, 1)` ring pulse, replayed only when the overall state changes (the element is keyed on state). It never loops.

### Mission Track (signature)
The flight-day timeline that every chart's time axis shares.
- **Lane:** 72px tall, bottom hairline in `shell-line`. Pre-flight days as a hatched block with an uppercase label.
- **Day bars:** height encodes severity as well as colour: normal 6px at 55% opacity, attention 16px, critical 26px; future days fade to 18%.
- **Onset markers:** 22px circles on the lane's top edge, 1.5px severity-coloured ring with the severity icon, buttons labelled "Ir ao dia N: início de …".
- **Cursor:** 2px `shell-ink` rule with a 12px knob ringed in the shell colour; slides 0.16s.
- **Chart window:** an open bracket under the lane showing the period plotted below.
- **Control:** an invisible full-height range input ("Dia de missão avaliado", `aria-valuetext` "Dia N de M"); when focused the whole lane gets the focus outline. Prev/next/play shell buttons and a segmented period toggle sit in the head.
- **Action markers:** 8px `shell-ink` diamonds on the lane's bottom edge, ringed 2px in the shell colour, one per logged action day (decorative; the follow-up list carries the text).
- **Legend:** miniature day-bar keys, onset icon, window key, action diamond, in muted shell text.
- **Pre-flight state:** before launch the lane is replaced by a pre-flight progress track: title "Pré-voo", a muted count line, and seven hatched `shell-line` steps that fill solid `shell-muted` as days pass.

### Buttons
- **Primary** (`button-primary`): indigo fill, white surface text, 40px min height; hover brightens 8%.
- **Secondary** (`button-secondary`): surface fill, 1px border; hover turns the border indigo. Small variant (`button-small`) 30px, 0.8rem. Urgent small variant: critical border and text at 700, used only for "medical officer contacted" on an escalating alert not yet acted on.
- **Link button:** underlined `series-1` text at 0.8rem for inline undo.
- **Shell button** (`shell-button`): on the shell, `shell-2` fill and `shell-line` border, 34px; hover border `shell-muted`; pressed inverts to `shell-ink` fill; disabled 40% opacity. Icon-only variant 6px 8px padding.
- **Segmented control:** shell buttons joined in one bordered 6px group; pressed segment inverts.
- **Console button** (`console-button`): demo scenario switches and own-mission actions, 3px corners, optional leading `kbd` key; hover border ink; pressed inverts to ink fill with the key outlined in current colour. The "Minha missão" entry is dashed; the destructive "Apagar meus dados" turns critical on hover.

### Severity Badge
- **Style:** 1px border in current colour over the severity tint, 6px corners, icon (check circle / triangle / octagon) + label ("Normal", "Atenção", "Crítico"). Large variant 1.1rem with a 22px icon.
- **Não avaliado** (`severity-badge-unassessed`): muted text on `surface-2`, dashed border, Unknown icon (dashed circle with a question mark); the coverage reason sits in its title. Shown whenever engine coverage for the variable is not ok.

### Origin Badge and Class Chip
- **Origin badge:** uppercase 0.7rem label with its own icon (beaker / gauge / approx) and stroke style per origin; present on every value.
- **Class chip:** uppercase 0.68rem, 3px corners; countermeasure in indigo, accumulator with a double border.

### Demo and Own-mission Bars
One line under the shell. The demo bar: uppercase expanded muted label ("Demonstração"), console-button scenario switches with `kbd` keys, a muted note and key hints that hide at narrower widths. The own-mission bar reuses that line: label "Minha missão", the crew member's name, a condensed tabular muted ID, a "Medido" origin badge, a muted baseline-progress sentence, and console-button actions pushed right.

### Vitals Strip
Seven equal cells in one bordered, shadowed strip with 1px internal rules. Each cell: muted name, condensed telemetry value with unit, tabular delta against baseline, origin, and a state line (icon + label) in the severity colour pinned to the bottom. Attention and critical cells take the severity tint as background; unassessed cells take `surface-2` with a muted "Não avaliado" state line. The whole cell links to its indicator; hover turns the name indigo.

### Alert Card
- **Container:** surface, 6px, surface lift; attention gets an amber 1px border, critical a 2px red border.
- **Head:** tinted with the severity background, severity badge, time right-aligned.
- **Order:** expanded title, then the action block first ("O que fazer", indigo sub-heading, guidance at 1.08rem/500), an escalation strip for critical (solid critical fill, `on-sev` text, phone icon), then "why / how calculated" in two columns (explanation | arithmetic in mono on `surface-2` + evidence table), then a foot with the source reference and any dashed amber arbitrary-threshold flag.
- **Action follow-up:** inside the action block, a dashed-rule section headed "Acompanhamento" with three small buttons (repeated measurement, medical officer contacted, action done), then a muted empty line or the list of logged actions (normal check icon, ink text, tabular day and time, "desfazer" link button) and, once done, a muted status line.
- **Compact variant:** smaller title for repeated placements.
- **All clear:** normal tint with a normal border and check icon.
- **Partial clear:** no alert fired but signals are unassessed: a `surface-2` box with a 1px dashed muted border, the Unknown icon, a count sentence and the list of unassessed signals with their reasons. Never the green all-clear.

### Cards / Containers
- **Corner Style:** 6px. **Background:** surface; heads on `surface-2`. **Shadow Strategy:** surface lift. **Border:** 1px `border`, internal dividers in `hairline`. **Internal Padding:** 18px 20px for panels, 14px 20px for cluster heads, 16px 18px for indicator cards.
- **Indicator:** card variant or row variant inside a cluster (meta column tinted by severity, chart beside it). Includes a "Sobre" disclosure whose chevron rotates 90° in 0.2s. When unassessed, a dashed `surface-2` note states the coverage reason.
- **How to measure:** a recessed `surface-2` box (hairline border, 6px, 0.85rem) titled in uppercase expanded `series-1`, with a two-column definition list (7.5rem muted bold terms); the compact variant stacks.

### Tabs
Text tabs on a 1px bottom rule, 600 weight at width 105%; selected tab gets ink text and a 3px indigo underline. A pill count in solid severity colour with `on-sev` text sits beside the label. Overflow scrolls horizontally.

### Inputs / Fields
- **Style:** `surface-2` fill, 1px border, 6px, 40px min height, tabular numerals; hover border muted.
- **Error:** border and 1px ring in critical, plus an inline icon + text message in critical.
- **Scale (1–5):** five 42px tiles; hover border indigo; checked fills indigo with surface text; focus ring drawn on the tile.

### Charts
Recharts with axis text condensed and tabular. Series 1–3 tokens (indigo, light blue, purple by day), the `band` baseline band, the `preflight` wash, `grid` lines, a custom legend in muted text, tooltip on surface with the chart-tooltip shadow and the reading's origin.

### Variable Term
Dotted-underlined term button with an info icon (`cursor: help`); hover or open turns underline and icon indigo. Opens a fixed 6px popover (`role="tooltip"`) with title + unit, "O que mede", "Por que importa no espaço", and a hairline-separated "Alerta quando" foot.

## Do's and Don'ts

### Do:
- **Do** show every state as icon + label + colour (badges, annunciator, vital state lines, tab counts, track onsets, field errors), and show missing coverage as dashed, muted "Não avaliado" with the Unknown icon, never as normal.
- **Do** set every measured value in Archivo at width 75% or 82% with tabular numerals, and every heading at width 115%.
- **Do** place time-based readings on the mission track's day axis and against the individual baseline band.
- **Do** carry the data origin (Medido / Sintético / Estimado) with its own icon and stroke style next to every value.
- **Do** swap indigo for sand in "pré-sono" mode for every role: links, focus, series 1, selection, primary button, brand mark.
- **Do** keep the annunciator pulse a single replay on state change, and honour `prefers-reduced-motion` (all animation and transitions off).
- **Do** keep focus visible: 2px outline at 2px offset in `--focus`, `shell-ink` inside the shell, on the whole track lane when its range input is focused. Keep the skip link, the polite live region for state changes, and 34–42px minimum control heights.

### Don't:
- **Don't** use green, amber or red for anything that is not a severity state.
- **Don't** introduce blue or violet into the night palette.
- **Don't** use monospace outside the arithmetic block.
- **Don't** loop or repeat the annunciator pulse, or add other attention animations.
- **Don't** use hard or offset shadows; depth is border plus soft ambient lift.
- **Don't** fall back to a grid of identical KPI cards with one blue accent; the vitals strip is one joined instrument, and alerts lead with the action.
