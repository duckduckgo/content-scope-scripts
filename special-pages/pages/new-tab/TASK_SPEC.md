# Quick Access to Image Generation & Web Search

| | |
|---|---|
| **Feature** | Image generation mode toggle and web search tool in NTP omnibar |
| **Feature Flags** | `enableImageGeneration`, `enableWebSearch` |
| **Platform** | macOS, Windows |
| **Design** | [Figma: Image Generation Mode - Desktop](https://www.figma.com/design/dy2BfN7iBERn1vr3kxgMLx/Image-Generation-Mode---Desktop?node-id=1-877&m=dev) |
| **Asana** | [Frontend: Provide quick access to image generation](https://app.asana.com/1/137249556945/project/1213083312441631/task/1213493651880757?focus=true) |

---

## What Is This?

A "Create Image" toggle and a "Web Search" option in the New Tab Page's Duck.ai omnibar. The "Create Image" toggle lets users switch from the default chat mode to image generation mode. The "Web Search" option lets users enable web search as a tool for their chat prompt. When active, these selections are forwarded to Duck.ai via the `omnibar_submitChat` notification.

---

## Why?

- **Demonstrated demand** — 7% of Duck.ai prompts are already image generation requests, showing clear user intent.
- **Friction gap** — Users currently cannot activate image creation mode or web search from native entry points (NTP, omnibar), forcing extra navigation steps through the Duck.ai website.
- **Image generation already works** — The backend support for `mode: "image-generation"` is already deployed and functional from the address bar; this feature exposes it in the NTP.
- **Web search enhances chat** — Enabling web search as a tool choice gives Duck.ai access to real-time information, improving answer quality for time-sensitive queries.

---

## User Flows

### Flow 1: Generate an image from the New Tab Page

1. User opens a new tab.
2. The Duck.ai omnibar is visible with the standard chat input.
3. User sees and activates the "Create Image" toggle/button.
4. The omnibar UI updates to indicate image generation mode is active.
5. User types a prompt (e.g., "a sunset over mountains").
6. User submits the prompt.
7. Duck.ai opens in image-generation mode with the user's prompt pre-filled.

### Flow 2: Chat with web search from the New Tab Page

1. User opens a new tab.
2. The Duck.ai omnibar is visible with the standard chat input.
3. User sees and activates the "Web Search" option.
4. The omnibar UI updates to indicate web search is enabled.
5. User types a prompt (e.g., "latest news about privacy laws").
6. User submits the prompt.
7. Duck.ai opens with web search enabled and the user's prompt pre-filled.

---

## Key Behaviors

| Behavior | Expected Outcome |
|---|---|
| `enableImageGeneration` flag is OFF | "Create Image" toggle is not visible in the omnibar |
| `enableImageGeneration` flag is ON | "Create Image" toggle is visible and functional |
| `enableWebSearch` flag is OFF | "Web Search" option is not visible in the omnibar |
| `enableWebSearch` flag is ON | "Web Search" option is visible and functional |
| User activates "Create Image" and submits a prompt | Duck.ai opens in `image-generation` mode |
| User activates "Web Search" and submits a prompt | `omnibar_submitChat` includes `toolChoice: ["WebSearch"]` |
| User submits without activating either option | Duck.ai opens in default chat mode (existing behavior) |
| User has a model selected alongside image-generation mode | No error; prompt is forwarded to Duck.ai correctly |
| User has a model selected alongside web search | No error; prompt is forwarded with `toolChoice` correctly |
| User attaches reference images | Existing `images` field is reused; works alongside image-generation mode |
| User activates both "Create Image" and "Web Search" | Both `mode` and `toolChoice` are included in the payload |

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|---|---|
| Feature flag enabled mid-session (without page reload) | Toggles should appear based on config at page load; may require new tab to pick up changes |
| User submits empty prompt in image-generation mode | Same behavior as empty prompt in chat mode (no submission or native handling) |
| User submits empty prompt with web search enabled | Same behavior as empty prompt in chat mode (no submission or native handling) |
| `modelId` present alongside `mode: "image-generation"` | Native should handle gracefully — no crash or error |
| `toolChoice` present alongside `modelId` | Native should handle gracefully — no crash or error |
| Older native app that doesn't understand `mode` field | Field is optional; omitted `mode` defaults to chat — backward-compatible |
| Older native app that doesn't understand `toolChoice` field | Field is optional; omitted `toolChoice` means no tools — backward-compatible |
| Network error after submission | Handled by native/Duck.ai, not the NTP omnibar |

---

## Platform Support

| Platform | Status |
|---|---|
| macOS | In scope (native integration required) |
| Windows | In scope (native integration required) |
| iOS | Not in scope |
| Android | Not in scope |


## Testing Notes

- **Mock transport**: Use `?omnibar.enableImageGeneration=true` and/or `?omnibar.enableWebSearch=true` query parameters to enable the feature flags locally without native support.
- **Verify toggle visibility**: Confirm the toggles appear when their respective flags are true in the config.
- **Verify mode forwarding**: When "Create Image" is active, the `omnibar_submitChat` message should include `mode: "image-generation"`.
- **Verify toolChoice forwarding**: When "Web Search" is active, the `omnibar_submitChat` message should include `toolChoice: ["WebSearch"]`.
- **Verify backward compatibility**: When neither option is active, the message should NOT include `mode` or `toolChoice` fields.
- **Cross-check with address bar**: Image generation from the address bar already works — the NTP flow should produce the same Duck.ai behavior.

---

## Open Questions

- What is the exact visual treatment of the "Create Image" toggle and "Web Search" option? (Refer to Figma design)
- Should the toggle states persist across new tabs or reset each time?
- Are there any rate limits or eligibility restrictions for image generation or web search that should be reflected in the NTP UI?
- Can web search and image generation be used simultaneously, or are they mutually exclusive?

---

## Analytics (TBD)

- Pixel/event when user activates "Create Image" toggle
- Pixel/event when user activates "Web Search" option
- Pixel/event when user submits a prompt in image-generation mode vs. chat mode vs. with web search
- Pixel/event for toggle deactivation (if needed for funnel analysis)
