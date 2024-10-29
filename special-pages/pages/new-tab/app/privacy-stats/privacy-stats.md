---
title: Privacy Stats
---

## Requests:
- {@link "NewTab Messages".StatsGetDataRequest `stats_getData`}
    - Used to fetch the initial data (during the first render)
    - returns {@link "NewTab Messages".PrivacyStatsData}

- {@link "NewTab Messages".StatsGetDataRequest `stats_getConfig`}
    - Used to fetch the initial config data (eg: expanded vs collapsed)
    - returns {@link "NewTab Messages".StatsConfig}

## Subscriptions:
- {@link "NewTab Messages".StatsOnDataUpdateSubscription `stats_onDataUpdate`}.
    - The tracker/company data used in the feed.
    - returns {@link "NewTab Messages".PrivacyStatsData}
- {@link "NewTab Messages".StatsOnDataUpdateSubscription `stats_onConfigUpdate`}.
    - The widget config
    - returns {@link "NewTab Messages".StatsConfig}

## Notifications:
- {@link "NewTab Messages".StatsSetConfigNotification `stats_setConfig`}
    - Sent when the user toggles the expansion of the stats
    - sends {@link "NewTab Messages".StatsConfig}
    - example payload:
      ```json
      {
        "expansion": "collapsed"
      }
      ```

## Examples:
The following examples show the data types in JSON format:
[messages/new-tab/examples/stats.js](../../../../messages/new-tab/examples/stats.js)
