---
title: Subscription Win-back Banner
---

## Requests:
- {@link "NewTab Messages".SubscriptionWinBackBannerGetDataRequest `winBackOffer_getData`}
    - Used to fetch the initial data (during the first render)
    - returns {@link "NewTab Messages".SubscriptionWinBackBannerData}

## Subscriptions:
- {@link "NewTab Messages".SubscriptionWinBackBannerOnDataUpdateSubscription `winBackOffer_onDataUpdate`}.
    - The messages available for the platform
    - returns {@link "NewTab Messages".SubscriptionWinBackBannerData}

## Notifications:
- {@link "NewTab Messages".SubscriptionWinBackBannerActionNotification `winBackOffer_action`}
    - Sent when the user clicks the action button
    - sends {@link "NewTab Messages".SubscriptionWinBackBannerAction}
    - example payload:
      ```json
      {
        "id": "winback_last_day"
      }
      ```

## Examples:

The following examples show the data types in JSON format:
[messages/new-tab/examples/stats.js](../../messages/examples/subscriptionWinBackBanner.js)
