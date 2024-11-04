---
title: Widget Config
---

## InitialSetup:

- Data for widgets should be provided as part of the {@link "NewTab Messages".InitialSetupResponse `initialSetup`} response.
- The following keys should be added (also see the example below)
    - `widgets`: {@link "NewTab Messages".Widgets}
    - `widgetConfigs`: {@link "NewTab Messages".WidgetConfigs}

## Subscriptions:
- {@link "NewTab Messages".WidgetsOnConfigUpdatedSubscription `widgets_onConfigUpdated`}
- returns {@link "NewTab Messages".WidgetConfigs}.


## Notifications:
- {@link "NewTab Messages".WidgetsOnConfigUpdatedSubscription `widgets_setConfig`}
- sends {@link "NewTab Messages".WidgetConfigs}

  If the user toggles the visibility of a section in the frontend, then the entire structure is sent to the
  native side.

## Examples:
The following examples show the data types in JSON format:
[messages/new-tab/examples/stats.js](../../../../messages/new-tab/examples/widgets.js)
