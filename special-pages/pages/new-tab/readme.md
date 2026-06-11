# URL Search Parameter Reference Guide
 This comprehensive guide documents all available URL search parameters for testing, reviews, and development purposes. Use these parameters to trigger specific states, features, or experiments without modifying code.

 ## Page-Level Parameters

 ### Component Display View
 - **Purpose**: Displays configurable stickersheet view outside normal page flow
 - **Parameter**: `display`
 - **Example**: `?display=components`
 - **Options**:
   - `components` - Shows component stickersheet

 ### Language/Locale Selector
 - **Purpose**: Tests UI with different languages to verify layout and translations
 - **Parameter**: `locale`
 - **Example**: `?locale=fr`
 - **Options**: Any language code available in the [locale directory](../public/locales)

 ### Text Length Modifier
 - **Purpose**: Tests UI with different text lengths to verify layout flexibility
 - **Parameter**: `textLength`
 - **Example**: `?textLength=1.5`
 - **Options**:
   - Number higher than 1

 ### Platform Simulator
 - **Purpose**: Simulates different platforms for testing
 - **Parameter**: `platform`
 - **Example**: `?platform=windows`
 - **Options**:
   - `windows`
   - `macos`
   - `android`
   - `ios`
   - `integration`

 ### Animation Toggle
 - **Purpose**: Enables/disables animations for testing
 - **Parameter**: `animation`
 - **Example**: `?animation=none`
 - **Options**:
   - `view-transitions` - Enables animations
   - `none` - Disables animations

 ### Error Testing
 - **Purpose**: Forces error state for testing error handling
 - **Parameter**: `willThrow`
 - **Example**: `?willThrow=true`
 - **Options**:
   - `true` - Forces an error

### Skip Reading form LocalStorage
 - **Purpose**: If present, prevents the mock transport from reading persisted state (like widget configs) from localStorage on initialization
 - **Parameter**: `skip-read`
 - **Example**: `?skip-read=true`
 - **Options**:
   - `true`

### Skip Writing to LocalStorage
 - **Purpose**: If present, prevents the mock transport from writing state changes (like widget configs) to localStorage
 - **Parameter**: `skip-read`
 - **Example**: `?skip-read=true`
 - **Options**:
   - `true`

### Theme Variant
 - **Purpose**: Sets a visual theme variant to customize the default background colors
 - **Parameter**: `themeVariant`
 - **Example**: `?themeVariant=violet&theme=light`
 - **Options**:
   - `default` - Default gray background
   - `coolGray` - Cool gray tones
   - `slateBlue` - Slate blue tones
   - `green` - Green tones
   - `violet` - Violet tones
   - `rose` - Rose tones
   - `orange` - Orange tones
   - `desert` - Desert tones
 - **Note**: Works with default backgrounds only. Custom colors/gradients override the variant.

 ## Feature Parameters

 ### Favorites
 - **Purpose**: Controls favorites feature
 - **Parameter**: `favorites`
 - **Example**: `?favorites=show`
 - **Options**:
   - `many`
   - `single`
   - `none`
   - `small-icon`
   - `fallbacks`
   - `titles`

 ### Update Notification
 - **Purpose**: Controls update notification display
 - **Parameter**: `update-notification`
 - **Example**: `?update-notification=show`
 - **Options**:
   - `show` - Shows update notification
   - `hide` - Hides update notification

 ### Update Notification Delay
 - **Purpose**: Sets delay before showing update notification
 - **Parameter**: `update-notification-delay`
 - **Example**: `?update-notification-delay=5000`
 - **Options**: Time in milliseconds

 ### Customizer Auto-Open
 - **Purpose**: Controls whether customizer opens automatically
 - **Parameter**: `customizer_autoOpen`
 - **Example**: `?customizer_autoOpen=true`
 - **Options**:
   - `true` - Opens customizer automatically
   - `false` - Does not open customizer automatically

 ### RMF (Remote Messaging Framework)
 - **Purpose**: Controls Remote Messaging Framework dialog
 - **Parameter**: `rmf`
 - **Example**: `?rmf=show`
 - **Options**:
   - `show` - Shows RMF dialog
   - `hide` - Hides RMF dialog

 ### RMF Delay
 - **Purpose**: Sets delay before showing RMF dialog
 - **Parameter**: `rmf-delay`
 - **Example**: `?rmf-delay=10000`
 - **Options**: Time in milliseconds

 ### Next Steps Cards
 - **Purpose**: Displays the different Next Steps cards
 - **Parameter**: `next-steps`
 - **Example**: `?next-steps=bringStuff`
 - **Options**:
   - `bringStuff`
   - `defaultApp`
   - `blockCookies`
   - `emailProtection`
   - `duckplayer`
   - `addAppToDockMac`
   - `pinAppToTaskbarWindows`
   - `subscription`

 ### Next Steps List Cards
 - **Purpose**: Displays the Next Steps List widget (single card at a time with step indicator)
 - **Parameter**: `next-steps-list`
 - **Example**: `?next-steps-list=bringStuff`
 - **Options**:
   - `bringStuff`
   - `defaultApp`
   - `personalizeBrowser`
   - `emailProtection`
   - `duckplayer`
   - `addAppToDockMac`
   - `pinAppToTaskbarWindows`
   - `subscription`
   - `sync`

 ### Freemium PIR Banner
 - **Purpose**: Tests different PIR banner states
 - **Parameter**: `pir`
 - **Example**: `?pir=onboarding`
 - **Options**:
   - `onboarding` - Shows onboarding PIR banner
   - `scan_results` - Shows scan results PIR banner

## Privacy Protections widget

 ### Activity
  - **Purpose**: Modifies activity display count
 - **Parameter**: `activity`
 - **Example**: `?activity=empty`
 - **Options**:
   - `empty`

 ### Feed Controls
 - **Purpose**: Modifies feed display and behavior
 - **Parameter**: `feed`
 - **Example**: `?feed=activity`
 - **Options**:
   - `stats` - Displays the Privacy Stats widget
   - `activity` - Displays the Activity widget
   - `both` - Display both privacy widgets

### Proctections
 - **Purpose**: Controls number of stats shown in Protections feature
 - **Parameter**: `protections`
 - **Example**: `?protections=many`
 - **Options**:
   - `many`
   - `few`
   - `empty`

### Protections Continuous
 - **Purpose**: Displays a continuous flow of protections stats to hydrate Protections widget
 - **Parameter**: `protections.continuous`
 - **Example**: `?protections.continuous=`
 - **Options**:


 ### Stats Display
 - **Purpose**: Controls statistics display
 - **Parameter**: `stats`
 - **Example**: `?stats=show`
 - **Options**:
   - `show` - Shows statistics
   - `hide` - Hides statistics

 ### Stats Update Count
 - **Purpose**: Sets the number of updates for statistics
 - **Parameter**: `stats-update-count`
 - **Example**: `?stats-update-count=5`
 - **Options**: Any positive integer




## Omnibar / AI Chat Parameters

### Omnibar Mode
 - **Purpose**: Sets the default omnibar mode (search or AI chat)
 - **Parameter**: `omnibar.mode`
 - **Example**: `?omnibar.mode=ai`
 - **Options**:
   - `search` - Default search mode
   - `ai` - AI chat mode

### Enable AI
 - **Purpose**: Enables the Duck.ai chat interface
 - **Parameter**: `omnibar.enableAi`
 - **Example**: `?omnibar.enableAi=true`
 - **Options**:
   - `true`
   - `false`

### Show AI Setting
 - **Purpose**: Controls whether the Duck.ai setting is shown
 - **Parameter**: `omnibar.showAiSetting`
 - **Example**: `?omnibar.showAiSetting=true`
 - **Options**:
   - `true`
   - `false`

### Show Customize Popover
 - **Purpose**: Shows the onboarding popover pointing to the customizer
 - **Parameter**: `omnibar.showCustomizePopover`
 - **Example**: `?omnibar.showCustomizePopover=true`
 - **Options**:
   - `true`
   - `false`

### Enable Recent AI Chats
 - **Purpose**: Shows recent AI chat history in the AI mode dropdown
 - **Parameter**: `omnibar.enableRecentAiChats`
 - **Example**: `?omnibar.enableRecentAiChats=true`
 - **Options**:
   - `true`
   - `false`

### Enable AI Chat Tools
 - **Purpose**: Feature flag to enable AI chat tools (model selector, image attachments)
 - **Parameter**: `omnibar.enableAiChatTools`
 - **Example**: `?omnibar.enableAiChatTools=true`
 - **Options**:
   - `true`
   - `false`

### Enable Image Generation
 - **Purpose**: Shows the "Create Image" tool in the AI chat toolbar's tools menu
 - **Parameter**: `omnibar.enableImageGeneration`
 - **Example**: `?omnibar.enableImageGeneration=true`
 - **Options**:
   - `true`
   - `false`

### Enable Web Search
 - **Purpose**: Shows the "Web Search" tool in the AI chat toolbar's tools menu
 - **Parameter**: `omnibar.enableWebSearch`
 - **Example**: `?omnibar.enableWebSearch=true`
 - **Options**:
   - `true`
   - `false`

### Selected Model ID
 - **Purpose**: Pre-selects a specific AI model in the model selector
 - **Parameter**: `omnibar.selectedModelId`
 - **Example**: `?omnibar.selectedModelId=claude-haiku-4-5`
 - **Options**: Any model ID from the `aiModelSections` config

### Subscription (simulate subscribed user)
 - **Purpose**: Flips `isEnabled: true` on every AI model in the mock, unlocking the "Advanced Models - DuckDuckGo subscription" section. Lets tests pick subscription-tier models (e.g. Opus 4.6, GPT-5.2) as `selectedModelId`.
 - **Parameter**: `omnibar.subscription`
 - **Example**: `?omnibar.subscription=true`
 - **Options**:
   - `true`
   - `false`

### Show View All AI Chats
 - **Purpose**: Shows a "View all chats" link at the bottom of the recent AI chats list
 - **Parameter**: `omnibar.showViewAllAiChats`
 - **Example**: `?omnibar.showViewAllAiChats=true`
 - **Options**:
   - `true`
   - `false`

### Subscription Win-back Banner
 - **Purpose**: Tests different win-back banner states
 - **Parameter**: `winback`
 - **Example**: `?winback=true`
 - **Options**:



 ## Combining Parameters

 Parameters can be combined using the `&` character to test multiple features simultaneously:

 `
 ?display=components&locale=fr&textLength=long
 `

 This example shows the component stickersheet in French with long text strings.

 ## Usage Examples

 ### For Developers
 - Testing language support: `?locale=de`
 - Testing responsive layouts: `?textLength=long&platform=mobile`
 - Testing error states: `?willThrow=true`

 ### For Product Reviews
 - Testing experiment variations: `?pir=onboarding`
 - Testing feature states: `?stats=show&feed=empty`

 ### For AI Chat Development
 - Full AI chat tools: `?omnibar.mode=ai&omnibar.enableAiChatTools=true&omnibar.enableImageGeneration=true&omnibar.enableWebSearch=true`
 - Image generation only: `?omnibar.mode=ai&omnibar.enableAiChatTools=true&omnibar.enableImageGeneration=true`
 - Web search only: `?omnibar.mode=ai&omnibar.enableAiChatTools=true&omnibar.enableWebSearch=true`

 ### For Design Reviews
 - Component review: `?display=components`
 - Testing text overflow: `?textLength=long`
 - Testing animations: `?animation=on`
