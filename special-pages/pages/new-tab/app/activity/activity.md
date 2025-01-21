---
title: Privacy Activity
---

## Requests:
- {@link "NewTab Messages".ActivityGetDataRequest `activity_getData`}
    - Used to fetch the initial data (during the first render)
    - returns {@link "NewTab Messages".PrivacyActivityData}

- {@link "NewTab Messages".ActivityGetDataRequest `activity_getConfig`}
    - Used to fetch the initial config data (eg: expanded vs collapsed)
    - returns {@link "NewTab Messages".ActivityConfig}

## Subscriptions:
- {@link "NewTab Messages".ActivityOnDataUpdateSubscription `activity_onDataUpdate`}.
    - The activity data used in the feed.
    - returns {@link "NewTab Messages".PrivacyActivityData}
- {@link "NewTab Messages".ActivityOnDataUpdateSubscription `activity_onConfigUpdate`}.
    - The widget config
    - returns {@link "NewTab Messages".ActivityConfig}

## Notifications:
- {@link "NewTab Messages".ActivitySetConfigNotification `activity_setConfig`}
    - Sent when the user toggles the expansion of the activity feed
    - sends {@link "NewTab Messages".ActivityConfig}
    - example payload:
      ```json
      {
        "expansion": "collapsed"
      }
      ```