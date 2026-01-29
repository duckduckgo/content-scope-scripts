# New Tab Page Widgets - macOS Integration Spec

This document describes the messaging API for weather, news, and stock widgets on the New Tab Page. These are "multi-instance" widgets that support multiple instances with individual configurations.

## Overview

The widget system uses a request/response messaging pattern:
- **Requests**: Web → Native (with async response)
- **Notifications**: Web → Native (fire-and-forget)
- **Subscriptions**: Native → Web (push updates)

## Initial Setup

When the New Tab Page loads, it calls `initialSetup` to get the initial state. Native must return the list of available widgets and their configurations.

### `initialSetup` Response (relevant fields)

```json
{
  "widgets": [
    { "id": "favorites" },
    { "id": "weather" },
    { "id": "news" },
    { "id": "stock" }
  ],
  "widgetConfigs": [
    { "id": "favorites", "visibility": "visible" },
    {
      "id": "weather",
      "instanceId": "weather-1",
      "visibility": "visible",
      "location": "Sydney, AU",
      "temperatureUnit": "fahrenheit",
      "expansion": "expanded"
    },
    {
      "id": "news",
      "instanceId": "news-1",
      "visibility": "visible",
      "query": "technology",
      "expansion": "expanded"
    },
    {
      "id": "stock",
      "instanceId": "stock-1",
      "visibility": "visible",
      "symbol": "AAPL",
      "expansion": "expanded"
    }
  ],
  "platform": { "name": "macos" },
  "env": "production",
  "locale": "en"
}
```

**Key points:**
- `widgets` array declares which widget types are available
- `widgetConfigs` contains per-instance configuration
- Multi-instance widgets (weather, news, stock) have an `instanceId` field
- When config value (`location`, `query`, `symbol`) is `null` or missing, the widget shows an "empty state" and does NOT fetch data

---

## Widget Configuration

### Widget Config Schemas

#### Weather Widget Config
```typescript
{
  id: "weather",
  instanceId: string,           // Unique instance ID (e.g., "weather-1")
  visibility: "visible" | "hidden",
  location: string | null,      // Location for weather. Null = unconfigured
  temperatureUnit?: "celsius" | "fahrenheit",
  expansion?: "expanded" | "collapsed"
}
```

#### News Widget Config
```typescript
{
  id: "news",
  instanceId: string,           // Unique instance ID (e.g., "news-1")
  visibility: "visible" | "hidden",
  query: string | null,         // Search query for news. Null = unconfigured
  expansion?: "expanded" | "collapsed"
}
```

#### Stock Widget Config
```typescript
{
  id: "stock",
  instanceId: string,           // Unique instance ID (e.g., "stock-1")
  visibility: "visible" | "hidden",
  symbol: string | null,        // Stock ticker symbol. Null = unconfigured
  expansion?: "expanded" | "collapsed"
}
```

### `widgets_setConfig` (Notification)

Web sends this when the user updates widget configuration.

**Direction:** Web → Native

**Payload:** Full `widgetConfigs` array (same schema as in `initialSetup`)

```json
{
  "widgetConfigs": [
    { "id": "favorites", "visibility": "visible" },
    {
      "id": "weather",
      "instanceId": "weather-1",
      "visibility": "visible",
      "location": "London, UK",
      "temperatureUnit": "celsius",
      "expansion": "expanded"
    }
  ]
}
```

**Native responsibilities:**
1. Persist the new configuration

**Important:** Do NOT send `widgets_onConfigUpdated` in response to `widgets_setConfig`. The web already has the updated config (it just sent it), so echoing it back is unnecessary.

### `widgets_onConfigUpdated` (Subscription)

Native pushes this ONLY when configuration changes from a native-initiated action (NOT in response to `widgets_setConfig`).

**Direction:** Native → Web

**Payload:** Same schema as `widgets_setConfig`

**When to send:**
- User changes settings via native UI (e.g., macOS System Preferences)
- Config synced from another device
- Config reset/restored from backup
- Any other native-side config modification

**When NOT to send:**
- After receiving `widgets_setConfig` from web (web already has this config)

---

## Weather Widget

### `weather_getData` (Request/Response)

Fetches weather data for a specific location. This is ONLY called when the widget has a configured location.

**Direction:** Web → Native → Web

**Request:**
```json
{
  "location": "Sydney, AU"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location` | string | Yes | Location/city name from the widget config |

**Response:**
```json
{
  "temperature": 25,
  "apparentTemperature": 27,
  "conditionCode": "sunny",
  "location": "Sydney, AU",
  "humidity": 65,
  "windSpeed": 12
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `temperature` | number | Yes | Current temperature in user's preferred unit |
| `apparentTemperature` | number | No | Feels-like temperature |
| `conditionCode` | string | Yes | Weather condition (e.g., "sunny", "cloudy", "rainy", "snowy") |
| `location` | string | Yes | Location name (can be more specific than request) |
| `humidity` | number | No | Humidity percentage |
| `windSpeed` | number | No | Wind speed |

---

## News Widget

### `news_getData` (Request/Response)

Fetches news articles for a specific topic/query. This is ONLY called when the widget has a configured query.

**Direction:** Web → Native → Web

**Request:**
```json
{
  "query": "technology"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query/topic from the widget config |

**Response:**
```json
{
  "results": [
    {
      "title": "Apple Announces New MacBook Pro",
      "url": "https://example.com/article",
      "source": "Tech News",
      "relative_time": "2 hours ago",
      "excerpt": "Apple today announced...",
      "image": "https://example.com/image.jpg"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `results` | array | Yes | Array of news items |

**News Item:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Article headline |
| `url` | string | Yes | Article URL |
| `source` | string | Yes | News source name |
| `relative_time` | string | No | Human-readable time (e.g., "2 hours ago") |
| `excerpt` | string | No | Article summary |
| `image` | string | No | Image URL |

---

## Stock Widget

### `stock_getData` (Request/Response)

Fetches stock data for a specific ticker symbol. This is ONLY called when the widget has a configured symbol.

**Direction:** Web → Native → Web

**Request:**
```json
{
  "symbol": "AAPL"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | Stock ticker symbol from the widget config |

**Response:**
```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc",
  "latestPrice": 258.27,
  "change": 2.86,
  "changePercent": 0.011198,
  "currency": "USD",
  "previousClose": 255.41,
  "open": 259.17,
  "high": 261.95,
  "low": 258.21,
  "week52High": 288.62,
  "week52Low": 169.21,
  "latestUpdate": 1769547600000,
  "primaryExchange": "NSQ",
  "peRatio": 34.39,
  "marketCap": null,
  "avgTotalVolume": null,
  "assetType": "stock"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | Stock ticker symbol |
| `companyName` | string | Yes | Company name |
| `latestPrice` | number | Yes | Current stock price |
| `change` | number | Yes | Price change (can be negative) |
| `changePercent` | number | Yes | Percent change as decimal (0.01 = 1%) |
| `currency` | string | Yes | Currency code (e.g., "USD") |
| `previousClose` | number | No | Previous closing price |
| `open` | number | No | Opening price |
| `high` | number | No | Day high |
| `low` | number | No | Day low |
| `week52High` | number | No | 52-week high |
| `week52Low` | number | No | 52-week low |
| `latestUpdate` | number | No | Timestamp in milliseconds |
| `primaryExchange` | string | No | Exchange code (e.g., "NSQ", "NYSE") |
| `peRatio` | number \| null | No | Price-to-earnings ratio |
| `marketCap` | number \| null | No | Market capitalization |
| `avgTotalVolume` | number \| null | No | Average total volume |
| `assetType` | string | No | Asset type (e.g., "stock") |

---

## Data Flow Examples

### Adding a New Widget Instance

```
1. User clicks "Add Weather Widget" in customizer

2. Web sends widgets_setConfig with new instance (location = null):
   {
     "widgetConfigs": [
       ...existing configs,
       { "id": "weather", "instanceId": "weather-2", "visibility": "visible", "location": null }
     ]
   }

3. Native persists config (no response needed)

4. Web renders widget in "empty state" (shows location input form)
   → NO weather_getData call is made
```

### Configuring a Widget

```
1. User enters "London" in the weather widget's location input and submits

2. Web sends widgets_setConfig with updated location:
   {
     "widgetConfigs": [
       ...existing configs,
       { "id": "weather", "instanceId": "weather-2", "visibility": "visible", "location": "London" }
     ]
   }

3. Native persists config (no response needed)

4. Web re-renders with the new location (it already has this config)

5. Web calls weather_getData({ location: "London" })

6. Native responds with weather data for London

7. Web displays the weather information
```

### Changing Widget Configuration

```
1. User changes location from "London" to "Tokyo" via settings menu

2. Web sends widgets_setConfig with new location

3. Native persists config (no response needed)

4. Web unmounts old provider, mounts new one with "Tokyo"

5. Web calls weather_getData({ location: "Tokyo" })

6. Native responds with Tokyo weather data

7. Web displays updated information
```

### Native-Initiated Config Change (uses `widgets_onConfigUpdated`)

```
1. User modifies widget config via native UI, or config syncs from another device

2. Native sends widgets_onConfigUpdated to web:
   {
     "widgetConfigs": [
       ...updated configs from native
     ]
   }

3. Web receives the update and re-renders affected widgets

4. If a widget now has valid config (e.g., location was set), web fetches data
```

---

## Implementation Checklist

### Native must implement:

- [ ] **`initialSetup`** - Return widgets and widgetConfigs in response
- [ ] **`widgets_setConfig`** - Handle notification, persist config (do NOT send `widgets_onConfigUpdated` in response)
- [ ] **`widgets_onConfigUpdated`** - Push subscription only for native-initiated config changes (sync, native UI, etc.)
- [ ] **`weather_getData`** - Fetch weather for location, return WeatherData
- [ ] **`news_getData`** - Fetch news for query, return NewsData
- [ ] **`stock_getData`** - Fetch stock for symbol, return StockData

### Important behaviors:

1. **No data fetch for unconfigured widgets** - Web only calls `*_getData` when the config value is present (non-null, non-empty string)

2. **Config params in getData** - The request includes the actual config value (`location`, `query`, `symbol`), not an `instanceId`. Native uses this value to fetch the appropriate data.

3. **No push subscriptions** - Data updates happen only via request/response. There are no `*_onDataUpdate` subscription messages for these widgets.

4. **Instance ID generation** - When adding a new widget instance, web generates a unique `instanceId` (e.g., "weather-1", "weather-2"). Native should persist and return these as-is.

5. **Full config replacement** - `widgets_setConfig` always sends the complete `widgetConfigs` array, not a delta.

6. **No echo on setConfig** - When native receives `widgets_setConfig`, it should persist the config but NOT send `widgets_onConfigUpdated` back. The web already has the config it just sent. The `widgets_onConfigUpdated` subscription is only for native-initiated changes (sync, native settings UI, etc.).

---

## Testing

1. **Empty state (unconfigured)**
   - Add a weather widget with `location: null`
   - Verify the widget shows an input form
   - Verify NO `weather_getData` request is made

2. **Configuration**
   - Submit a location in the form
   - Verify `widgets_setConfig` is called with the new location
   - Verify `weather_getData` is called with `{ location: "<entered value>" }`
   - Verify the widget displays the returned data

3. **Config change**
   - Change the location via settings menu
   - Verify a new `weather_getData` request is made with the new location
   - Verify the display updates

4. **Multiple instances**
   - Add two weather widgets with different locations
   - Verify each makes separate `weather_getData` calls
   - Verify each displays its own data independently

Repeat for news (with `query`) and stock (with `symbol`) widgets.
