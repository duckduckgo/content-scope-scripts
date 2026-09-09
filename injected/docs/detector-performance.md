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
- `detectorOverrides` can replace the single-run or accumulated edges for one detector group.
- `maxSeverePerPage` caps immediate severe events in each frame. It likewise retains its original name for config compatibility.

Invalid threshold lists fall back to C-S-S defaults. Threshold lists are normalized to ascending, unique, positive finite values.

## Event contract

All detector performance event types use the reserved `detectorPerf_` prefix:

- `detectorPerf_measured` — the top frame initialized the feature
- `detectorPerf_<group>_ran` — a detector in the named group ran
- `detectorPerf_<group>_failed` — a detector in the named group threw during evaluation
- `detectorPerf_<group>_over<N>ms` — one run in the group exceeded threshold `N`
- `detectorPerf_<group>_total_over<N>ms` — the group's accumulated time in the frame exceeded `N`
- `detectorPerf_combined_over<N>ms` — accumulated time for all instrumented detectors in the frame exceeded `N`
- `detectorPerf_severe` — an immediate event for crossing the highest configured single, total, or combined threshold

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

`kind` is `single`, `total`, or `combined`. Single-run events identify the exact config-driven detector. Totals use the detector group because the accumulator is shared within that group; combined crossings use the literal `combined`.

## Frames and EventHub deduplication

Each injected frame owns its own accumulators and at-most-once guards. Only the top frame emits `detectorPerf_measured`, preventing subframes from inflating the page denominator.

Native EventHub owns page-level deduplication. Consequently, periodic counters represent pages where at least one frame crossed a threshold, not the number of frame emissions.

## Breakage reports

User-initiated breakage reports include the reporting frame's exact accumulated Web Detection values:

- run count
- total duration
- worst duration
- combined duration across instrumented detectors

These values are rounded to 0.1 ms. Unlike periodic telemetry, config-driven detectors retain their exact IDs in breakage reports.

## Debug test-page event

When the platform debug flag is enabled, the feature dispatches a page-observable `detectorPerfDebugStats` `CustomEvent` after each recorded run. Production builds must never enable this flag on user pages.

The listener and visual overlay live in the privacy-test-pages repository at
[`features/detector-perf/overlay.js`](https://github.com/duckduckgo/privacy-test-pages/blob/detector-perf-monitoring/features/detector-perf/overlay.js).
C-S-S integration tests also listen for the event to verify that it is emitted only in debug mode.
