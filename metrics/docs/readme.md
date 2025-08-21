---
title: Metrics
---

# Metrics

Utility class for reporting metrics and exceptions to the native layer.

This class provides standardized methods for sending metric events and exception reports
through the messaging system. It includes predefined metric names for common error types
and helper methods to construct and send metric events.

Please see [metrics-reporter.js](../metrics-reporter.js)
for the message schema

{@includeCode ../examples/metrics.js}