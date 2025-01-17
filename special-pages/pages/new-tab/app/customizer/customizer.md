---
title: Customizer
---

## Drawer Feature Flag

- To enable the drawer feature for customization, change the {@link "NewTab Messages".NewTabPageSettings "Settings"} that are part of the `initialSetup` message
- It will default to the popover menu
- Example:


**Example InitialSetup response**

```json
{
  "...": "...",
  "widgets": [
    { "id": "rmf" },
    { "id": "nextSteps" },
    { "id": "favorites" },
    { "id": "privacyStats" }
  ],
  "widgetConfigs": [
    { "id": "favorites", "visibility": "visible" },
    { "id": "privacyStats", "visibility": "visible" }
  ],
  "settings": {
    "customizerDrawer": {
      "state": "enabled",
      "autoOpen": false
    }
  },
  "customizer": {
    "userImages": [],
    "userColor": null,
    "theme": "dark",
    "background": { "kind": "default" }
  }
}
```

## Initial Data

- Add the key `customizer` to `initialSetup`
- The data takes the following form: {@link "NewTab Messages".CustomizerData}
- Example from `initialSetup`

```json
{
  "...": "...",
  "customizer": {
    "userImages": [],
    "userColor": null,
    "theme": "dark",
    "background": { "kind": "default" }
  }
}
```

## Subscriptions

- {@link "NewTab Messages".CustomizerOnBackgroundUpdateSubscription `customizer_onBackgroundUpdate`}.
    - Sends {@link "NewTab Messages".BackgroundData} whenever needed.
    - For example:
    - ```json
      {
        "background": { "kind": "color", "value": "color01" }
      } 
      ```
    - ```json
      {
        "background": { "kind": "gradient", "value": "gradient01" }
      } 
      ```
    - ```json
      {
        "background": { "kind": "hex", "value": "#cacaca" }
      } 
      ```
    - ```json
      {
        "background": { "kind": "default" }
      } 
      ```
    - ```json
      {
        "background": { 
           "kind": "userImage", 
           "value": { "id":  "abc", "src": "...", "thumb": "...", "colorScheme": "light" } 
        }
      } 
      ```
      
- {@link "NewTab Messages".CustomizerOnImagesUpdateSubscription `customizer_onImagesUpdate`}.
    - Sends {@link "NewTab Messages".UserImageData} whenever needed.
    - For example, this would be pushed into the page following a successful upload
      - Note: In that situation, you'd send this followed by `customizer_onBackgroundUpdate` above
    - For example:
    - ```json
      {
        "userImages": [{"id":  "abc", "src": "...", "thumb": "...", "colorScheme": "light" }]
      } 
      ```
      
- {@link "NewTab Messages".CustomizerOnColorUpdateSubscription `customizer_onColorUpdate`}.
    - Sends {@link "NewTab Messages".UserColorData} whenever needed.
    - For example:
    - ```json
      {
        "userColor": { "kind": "hex", "value": "#cacaca" }
      } 
      ```
      or:
    - ```json
      {
        "userColor": null
      } 
      ```
      
- {@link "NewTab Messages".CustomizerOnThemeUpdateSubscription `customizer_onThemeUpdate`}.
    - Sends {@link "NewTab Messages".ThemeData} whenever needed.
    - For example:
    - ```json
      {
        "theme": "system"
      } 
      ```
  
- {@link "NewTab Messages".CustomizerAutoOpenSubscription `customizer_autoOpen`}.
  - Send this into the page to trigger the customizer to be opened.

## Notifications

- {@link "NewTab Messages".CustomizerSetBackgroundNotification `customizer_setBackground`}.
    - Sends {@link "NewTab Messages".CustomizerSetBackgroundNotify} whenever needed.
    - For example:
    - ```json
      {
        "background": { "kind": "color", "value": "color01" }
      } 
      ```
  
- {@link "NewTab Messages".CustomizerSetThemeNotification `customizer_setTheme`}.
    - Sends {@link "NewTab Messages".CustomizerSetBackgroundNotify} whenever needed.
    - For example:
    - ```json
      {
        "theme": "light"
      } 
      ```

- {@link "NewTab Messages".CustomizerUploadNotification `customizer_upload`}.
    - Sent to trigger a file upload
  
- {@link "NewTab Messages".CustomizerDeleteImageNotification `customizer_deleteImage`}.
    - Sends {@link "NewTab Messages".CustomizerDeleteImageNotify} whenever needed.
    - For example:
    - ```json
      {
        "id": "abc"
      } 
      ```
  
- {@link "NewTab Messages".CustomizerContextMenuNotification `customizer_contextMenu`}.
    - Sends {@link "NewTab Messages".UserImageContextMenu} 
    - Note: only sent for right-clicks on user images in the selection screen.
    - For example:
    - ```json
      {
        "target": "userImage",
        "id": "01"
      } 
      ```
