---
title: Freemium PIR Banner
---

## Requests:
- {@link "NewTab Messages".RmfGetDataRequest `freemiumPIRBanner_getData`}
    - Used to fetch the initial data (during the first render)
    - returns {@link "NewTab Messages".FreemiumPIRBannerData}

## Subscriptions:
- {@link "NewTab Messages".RmfOnDataUpdateSubscription `freemiumPIRBanner_onDataUpdate`}.
    - The messages available for the platform
    - returns {@link "NewTab Messages".FreemiumPIRBannerData}

## Notifications:
- {@link "NewTab Messages".RmfPrimaryActionNotification `freemiumPIRBanner_primaryAction`}
    - Sent when the user clicks the primaryAction button
    - sends {@link "NewTab Messages".FreemiumPIRBannerPrimaryAction}
    - example payload:
      ```json
      {
        "id": "windows_privacy_pro_survey_2"
      }
      ```
- {@link "NewTab Messages".RmfSecondaryActionNotification `freemiumPIRBanner_secondaryAction`}
    - Sent when the user clicks the secondaryAction button
    - sends {@link "NewTab Messages".FreemiumPIRBannerSecondaryAction}
    - example payload:
      ```json
      {
        "id": "windows_privacy_pro_survey_2"
      }
      ```
- {@link "NewTab Messages".RmfDismissNotification `freemiumPIRBanner_dismiss`}
    - Sent when the user clicks the dismiss button
    - sends {@link "NewTab Messages".FreemiumPIRBannerDismissAction}
    - example payload:
      ```json
      {
        "id": "windows_privacy_pro_survey_2"
      }
      ```

## Examples:

The following examples show the data types in JSON format:
[messages/new-tab/examples/stats.js](../../messages/examples/freemiumPIR.js)
