---
name: page-load-capture
description: Record every frame of a page load and report loading UX regressions (flashes of white or the wrong colour, flicker, layout shifts, content popping in, long tasks) with a labelled contact sheet of each visual state. Works on special pages, any URL, or a native screen recording. Use proactively to verify before and after any change that could affect what a special page (especially the New Tab Page) shows while loading - initial render, placeholders and loading states, widgets or components that load data asynchronously, layout/spacing/sizing CSS, theming and background colours, index.html, or initialSetup/getConfig/getData messages - and whenever investigating a white flash, theme flicker, layout shift, jank or something popping in during load.
allowed-tools: Bash(node .claude/skills/page-load-capture/capture.mjs:*) Bash(npm run build:*)
---

# Page load capture

`capture.mjs` loads a page in Playwright and records every painted frame from the start of navigation. It also runs in-page instrumentation. Identical consecutive frames collapse into distinct **states**, and the script checks those states and the instrumentation for problems.

| Finding | How it's detected | Engines |
|---|---|---|
| **flash** | State's mean luminance differs from the settled page by more than `--flash-threshold` | all |
| **flicker** | State A→B→A: a detour the page then undoes | all |
| **shift** | An already-visible element moved by ≥ `--shift-threshold` px between animation frames (outermost moving element only), plus `layout-shift` performance entries | rAF tracking: all; `layout-shift`: Chromium |
| **waves** | Elements (≥1% of viewport) appearing, grouped into waves 50ms apart. Several waves mean content pops in | all |
| **longtask** | Main-thread tasks >50ms | Chromium |

The script exits non-zero if any run has a flash, flicker or shift.

## Usage

```sh
npm run build   # special pages are served from build/integration/pages
node .claude/skills/page-load-capture/capture.mjs --params 'theme=dark&rebrand=enabled'
node .claude/skills/page-load-capture/capture.mjs --browser webkit --runs 3 --params 'rmf=big_two_action&rmf-delay=800'
node .claude/skills/page-load-capture/capture.mjs --url http://localhost:8000/
node .claude/skills/page-load-capture/capture.mjs --video ~/Desktop/recording.mov
```

Read each run's `states.png`:
- Every distinct state is labelled with its time since navigation.
- Problem states have a red border.
- Regions that changed since the previous state are shaded yellow.
- Shifted elements show their before position in blue and their after position in pink.

`report.json` has per-state numbers and the full instrumentation timeline. `states.html` is the same sheet at full resolution.

## Checking a change for regressions

1. Capture a baseline before the change: build, then run the scenarios the change touches. Use `--runs 3` or more, in both `--browser chromium` and `--browser webkit`.
2. Make the change, rebuild, and capture the same scenarios.
3. Compare the number of distinct states, the flags, the shifts and the waves. New flashes, flicker or shifts are regressions. A new wave means content now pops in later.

Real native responses are slower than the mocks, so delay the messages your change depends on to widen race windows. Mock params that do this include `omnibar.configDelay=600`, `rmf-delay=800` and `update-notification-delay=800`; add similar ones to a widget's mock transport when needed. Also cover light and dark (`--scheme` plus `theme=`), and `rebrand=enabled` while the rebrand flag exists.

## Options

| Option | Default | Meaning |
|---|---|---|
| `--page` | `new-tab` | Special page directory under `build/integration/pages` |
| `--params` | `''` | Query string for the page's mock transport, e.g. `theme=dark&themeVariant=slateBlue&background=color01` |
| `--url` | | Load an arbitrary URL instead of a built special page |
| `--video` | | Analyse an existing recording instead of loading anything (no DOM instrumentation). Crop it to the window first with `ffmpeg -vf crop=w:h:x:y` |
| `--browser` | `chromium` | `chromium` (CDP screencast: every compositor frame, CPU throttling) or `webkit` (closer to Apple platforms, but 25fps video) |
| `--scheme` | `dark` | `prefers-color-scheme` |
| `--loading-color` | canvas colour for `--scheme` | Value substituted for `$LOADING_COLOR$`; `none` leaves it untouched, as macOS does |
| `--backdrop` | loading colour, or white with `none` | Colour shown before navigation, standing in for the native web view's background |
| `--cpu` | `4` | Chromium CPU throttling; widens race windows |
| `--runs` | `1` | Repeat to catch intermittent problems |
| `--duration` | `2500` | ms to record after navigation starts |
| `--viewport` | `1200x800` | |
| `--flash-threshold` | `0.15` | Luminance delta (0–1) that counts as a flash |
| `--shift-threshold` | `3` | px movement that counts as a shift |
| `--no-dom` | | Disable rAF geometry tracking if its per-frame layout reads skew timing |
| `--out` | `test-results/page-load-capture` | Wiped on each invocation |

## Interpreting results

- Movement from intentional animations (expanding sections, transitions) is reported as shifts. Check the element names before treating a shift as a bug.
- The rAF tracker forces layout once per frame, so timings are slightly pessimistic.
- For special pages, `$LOADING_COLOR$` is substituted by Windows but not macOS. Use `--loading-color none` to reproduce macOS.
- A custom background or theme variant isn't known until `initialSetup` returns, so the first paint uses the default canvas colour. Unless native supplies the colour up front, that change isn't avoidable on the web side.
