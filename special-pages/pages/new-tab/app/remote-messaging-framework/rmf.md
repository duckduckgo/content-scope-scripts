---
title: Remote Messaging Framework
---

## Requests:
- {@link "NewTab Messages".RmfGetDataRequest `rmf_getData`}
    - Used to fetch the initial data (during the first render)
    - returns {@link "NewTab Messages".RMFData}

## Subscriptions:
- {@link "NewTab Messages".RmfOnDataUpdateSubscription `rmf_onDataUpdate`}.
    - The messages available for the platform
    - returns {@link "NewTab Messages".RMFData}

## Notifications:
- {@link "NewTab Messages".RmfPrimaryActionNotification `rmf_primaryAction`}
    - Sent when the user clicks the primaryAction button
    - sends {@link "NewTab Messages".RMFPrimaryAction}
    - example payload:
      ```json
      {
        "id": "windows_privacy_pro_survey_2"
      }
      ```
- {@link "NewTab Messages".RmfSecondaryActionNotification `rmf_secondaryAction`}
    - Sent when the user clicks the secondaryAction button
    - sends {@link "NewTab Messages".RMFSecondaryAction}
    - example payload:
      ```json
      {
        "id": "windows_privacy_pro_survey_2"
      }
      ```
- {@link "NewTab Messages".RmfDismissNotification `rmf_dismiss`}
    - Sent when the user clicks the dismiss button
    - sends {@link "NewTab Messages".RMFDismissAction}
    - example payload:
      ```json
      {
        "id": "windows_privacy_pro_survey_2"
      }
      ```

## Examples:

The following examples show the data types in JSON format:
[messages/new-tab/examples/stats.js](../../messages/examples/rmf.js)
