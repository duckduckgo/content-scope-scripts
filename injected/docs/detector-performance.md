# Detector performance monitoring

The `detectorPerf` feature measures synchronous detector execution time and reports threshold crossings through `webEvents`. Native EventHub consumes those events and aggregates them into periodic telemetry.

The feature is remote-config gated. When it is disabled or unavailable, detector behavior is unchanged and no performance data is attached to breakage reports.

## Instrumented detectors

Periodic telemetry uses Web Detection group labels such as `adwalls`, `captcha`, `commentsDisabled`, and `other`.

Detectors within a group are pooled for periodic event names, reducing telemetry size while distinguishing broad detector families. The exact ID, such as `adwalls.generic_en`, is retained for single-run severe-event attribution and breakage-report data.

The on-demand bot and fraud detectors are not instrumented because their request-driven sampling is not comparable with automatically running Web Detection. Their detection results remain in breakage reports independently of detector performance monitoring. The YouTube interference detector is also excluded because its recurring sweep does not have the same run and accumulated-total semantics.

## Settings

- `defaults.singleRunThresholdsMs` controls worst-single-run event edges.
- `defaults.totalPerPageThresholdsMs` controls accumulated edges for each frame. The setting retains its original `PerPage` name for config compatibility.
- `combinedThresholdsMs` controls accumulated edges across all instrumented detectors in a frame.
- `singleRunSevereThresholdMs` makes every crossed single-run edge at or above the cutoff emit immediate severe telemetry.
- `totalPerPageSevereThresholdMs` does the same for crossed per-group accumulated edges.
- `combinedSevereThresholdMs` does the same for crossed combined accumulated edges.
- `detectorOverrides` can replace the single-run or accumulated edges for one detector group.
- `maxSeverePerPage` caps immediate severe events in each frame. It likewise retains its original name for config compatibility.

Invalid threshold lists fall back to C-S-S defaults. Threshold lists are normalized to ascending, unique, positive finite values. An absent or invalid severe cutoff retains the previous behavior of emitting only at the highest edge.

## Event contract

All detector performance event types use the reserved `detectorPerf_` prefix:

- `detectorPerf_measured` — the top frame initialized the feature
- `detectorPerf_<group>_ran` — a detector in the named group ran
- `detectorPerf_<group>_failed` — a detector in the named group threw during evaluation, or its run ended on a failure or an error
- `detectorPerf_<group>_over<N>ms` — one run in the group exceeded threshold `N`
- `detectorPerf_<group>_total_over<N>ms` — the group's accumulated time in the frame exceeded `N`
- `detectorPerf_combined_over<N>ms` — accumulated time for all instrumented detectors in the frame exceeded `N`
- `detectorPerf_severe` — an immediate event for each crossed single-run, per-group total, or combined edge at or above its severe cutoff, and for a dispatch whose total goes past the single-run severe cutoff

Thresholds are configuration values embedded in event names. Every threshold change therefore requires corresponding EventHub sources in privacy configuration. C-S-S unit tests enumerate the possible output types, while privacy-configuration tests verify both directions of the contract: every possible event has a consumer and no stale `detectorPerf_` source remains.

Failed runs still contribute to run and duration events because failed detector work consumes CPU. Failure events fire at most once per frame, so their periodic counters measure pages containing one or more failures rather than the exact number of exceptions.

`detectorPerf_severe` includes:

```json
{
    "kind": "single",
    "detector": "adwalls.generic_en",
    "thresholdMs": 150
}
```

`kind` is `single`, `total`, `combined`, or `dispatch`. Single-run events identify the exact config-driven detector. Totals use the detector group because the accumulator is shared within that group; combined crossings use the literal `combined`. Dispatch events identify the exact detector with the largest share of the dispatch when its total went past the cutoff, with a tie going to the detector that ran first. Severe events are deduplicated per detector, kind, and threshold. When several edges cross together, the highest edges emit first so the frame cap preserves the strongest signals.

## Frames and EventHub deduplication

Each injected frame owns its own accumulators and at-most-once guards. Only the top frame emits `detectorPerf_measured`, preventing subframes from inflating the page denominator.

Native EventHub owns page-level deduplication. Consequently, periodic counters represent pages where at least one frame crossed a threshold, not the number of frame emissions.

## Dispatches

A dispatch is one call from the browser into Web Detection that runs detectors, such as an `auto` timer or the breakage report's run. Web Detection passes a dispatch ID with each run, and the runs with one ID add up to the dispatch's total, which is the detector work in that call stack. Runs also count towards their own single-run and accumulated edges.

When a dispatch's total goes past the single-run severe cutoff (`singleRunSevereThresholdMs`, or the highest default single-run edge without it), `detectorPerf_severe` fires with `kind: dispatch`, at most once per frame per detector and threshold like other severe events. Dispatches have no periodic events.

## Breakage reports

User-initiated breakage reports include the reporting frame's exact accumulated Web Detection values:

- run count
- total duration
- worst duration
- combined duration across instrumented detectors
- the dispatch with the largest total, as `worstDispatch`, with each detector's share of it by exact ID. It's left out when no run had a dispatch ID

These values are rounded to 0.1 ms. Unlike periodic telemetry, config-driven detectors retain their exact IDs in breakage reports.

## Debug test-page event

When the platform debug flag is enabled, the feature dispatches a page-observable `detectorPerfDebugStats` `CustomEvent` after each recorded run. Production builds must never enable this flag on user pages.

The listener and visual overlay live in the privacy-test-pages repository at
[`features/detector-perf/overlay.js`](https://github.com/duckduckgo/privacy-test-pages/blob/detector-perf-monitoring/features/detector-perf/overlay.js).
C-S-S integration tests also listen for the event to verify that it is emitted only in debug mode.
