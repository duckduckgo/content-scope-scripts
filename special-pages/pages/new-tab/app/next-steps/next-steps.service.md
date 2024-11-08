---
title: Next Steps Cards
---

## Requests:
- {@link "NewTab Messages".NextStepsGetDataRequest `nextSteps_getData`}
    - Used to fetch the initial data (during the first render)
    - returns {@link "NewTab Messages".NextStepsData}
- {@link "NewTab Messages".NextStepsGetConfigRequest `nextSteps_getConfig`}
    - Used to fetch the initial config (during the first render)
    - returns {@link "NewTab Messages".NextStepsConfig}

## Subscriptions:
- {@link "NewTab Messages".NextStepsOnDataUpdateSubscription `nextSteps_onDataUpdate`}.
    - The messages available for the platform
    - returns {@link "NewTab Messages".NextStepsData}
- {@link "NewTab Messages".NextStepsOnConfigUpdateSubscription `nextSteps_onConfigUpdate`}.
    - The widget config
    - returns {@link "NewTab Messages".NextStepsConfig}

## Notifications:
- {@link "NewTab Messages".NextStepsActionNotification `nextSteps_action`}
    - Sent when the user clicks the action button
    - sends {@link "NewTab Messages".NextStepsActionNotify}
    - example payload:
      ```json
      {
        "id": "defaultApp"
      }
      ```
- {@link "NewTab Messages".NextStepsDismissNotification `nextSteps_dismiss`}
    - Sent when the user clicks the dismiss button
    - sends {@link "NewTab Messages".NextStepsDismissNotify}
    - example payload:
      ```json
      {
        "id": "defaultApp"
      }
      ```
- {@link "NewTab Messages".NextStepsSetConfigNotification `nextSteps_setConfig`}
    - Sent when the user toggles the expansion of the next steps
    - sends {@link "NewTab Messages".NextStepsConfig}
    - example payload:
      ```json
      {
        "expansion": "collapsed"
      }
      ```
