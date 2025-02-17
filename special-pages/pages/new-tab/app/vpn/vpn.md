---
title: VPN
---

## Setup

- Widget ID: `"vpn"`
- Add it to the `widgets` + `widgetConfigs` fields on [initialSetup](../new-tab.md)
- Example:

```json
{
  "...": "...",
  "widgets": [
    {"...":  "..."},
    {"id":  "vpn"}
  ],
  "widgetConfigs": [
    {"...":  "..."},
    {"id": "vpn", "visibility": "visible" }
  ]
}
```

Then, the following Requests, Notifications and Subscriptions will be used.

## Requests:
### `vpn_getData` 
- {@link "NewTab Messages".VpnGetDataRequest}
- Used to fetch the initial data (during the first render)
- returns {@link "NewTab Messages".VPNWidgetData}

### `vpn_getConfig` 
- {@link "NewTab Messages".VpnGetConfigRequest}
- Used to fetch the initial config data (eg: expanded vs collapsed)
- returns {@link "NewTab Messages".VPNConfig}

## Subscriptions:
### `vpn_onDataUpdate` 
- {@link "NewTab Messages".VpnOnDataUpdateSubscription}.
- All state updates sent though this single subscription. 
- returns {@link "NewTab Messages".VPNWidgetData}

### `vpn_onConfigUpdate` 
- {@link "NewTab Messages".VpnOnConfigUpdateSubscription}.
- The widget config
- returns {@link "NewTab Messages".VPNConfig}

## Notifications:
### `vpn_setConfig` 
- {@link "NewTab Messages".VpnSetConfigNotification}
- Sent when the user toggles the expansion of the widget
- sends {@link "NewTab Messages".VPNConfig}
- example payload:
```json
{
  "expansion": "collapsed"
}
```

### `vpn_connect`
- When you receive this, immediately publish new data through `vpn_onDataUpdate` and 
set the `pending` field to `connecting`.
- When a connection was established, send more data, this time with state: 'connected' and pending 'none' (see the examples) 

### `vpn_disconnect` 
- When you receive this, immediately publish new data through `vpn_onDataUpdate` and
  set the `pending` field to `disonnecting`.
- When the connection is closed, send more data, this time with state: 'disconnected' and pending 'none' (see the examples) 

### `vpn_try` 
- Sent when a new uses presses 'Try For Free'

## Example Flows.

There are 3 separate states: 'unsubscribed', 'connected' and 'disconnected'. For each, they have a corresponding
data type that you deliver under 'value'.

- `unsubscribed`: null
- `connected`: {@link "NewTab Messages".ConnectedData}
- `disconnected`: {@link "NewTab Messages".DisconnectedData}

### Unsubscribed

- FE requests data through `vpn_getData`
- Native returns
```json
{
  "state": "unsubscribed",
  "value": null,
  "pending": "none"
}
```

### Disconnected

To connect, the FE will send a signal, and the Native side will continuously push updates.

- FE requests data through `vpn_getData`
- Native returns this: (where `value` is {@link "NewTab Messages".DisconnectedData})
```json
{
  "state": "disconnected",
  "value": {"...": "..."},
  "pending": "none"
}
```
- FE tries to connect, with `vpn_connect`
- Native immediately pushes: (note, state is still 'disconnected' here)
```json
{
  "state": "disconnected",
  "value": {"...": "..."},
  "pending": "connecting"
}
```
- After the connection is complete, native sends these messages continuously
```json
{
  "state": "connected",
  "value": {"...": "..."},
  "pending": "none"
}
```

### Connected

To disconnect, the FE will send a signal again, and will expect the Native side to continuously push updates.

- NTP is opened, and the state is fetched
- Native returns this: (where `value` is {@link "NewTab Messages".ConnectedData})
```json
{
  "state": "connected",
  "value": {"...": "..."},
  "pending": "none"
}
```
- FE tries to disconnect, via `vpn_disconnect`
- Native immediately pushes: (note, state is still 'connected' here)
```json
{
  "state": "connected",
  "value": {"...": "..."},
  "pending": "disconnecting"
}
```
- After the connection has ended, native sends these messages
```json
{
  "state": "disconnected",
  "value": {"...": "..."},
  "pending": "none"
}
```