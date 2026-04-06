# QA Spec: Image Generation Mode Toggle & Web Search Tool

Test URL: http://localhost:8000/?omnibar.mode=ai&omnibar.enableAiChatTools=true&omnibar.enableImageGeneration=true&omnibar.enableRecentAiChats=true&omnibar.enableWebSearch=true
Figma: https://www.figma.com/design/dy2BfN7iBERn1vr3kxgMLx/Image-Generation-Mode---All-Platforms?node-id=1468-25528&m=dev

## Feature Summary

- "Create Image" toggle and "Web Search" option in the NTP Duck.ai omnibar
- "Create Image" switches the omnibar from chat mode to image-generation mode
- "Web Search" enables web search as a tool choice for chat prompts
- Both are controlled by feature flags (`enableImageGeneration`, `enableWebSearch`)
- Selections are forwarded to Duck.ai via `omnibar_submitChat` notification

## Design Reference (from Figma)

### Desktop NTP States

1. **Default NTP with "Tools" button**: Omnibar shows "Ask anything privately" placeholder, bottom row has attach icon, "Tools" button (with settings icon), right side has model selectors. (node 1617:7172)
2. **NTP with "Create Image" active**: Same layout but "Create Image" replaces "Tools" button — shows image-gen icon + "Create Image" label. Model selector visible. (node 1:15266)
3. **NTP with "Create Image" chip active + tools icon**: Attach icon, tools icon, "Create Image x" dismissible chip. (node 1468:25527)
4. **NTP with reference image + Create Image**: Placeholder "Describe changes based on the image", thumbnail with x close, "Create Image x" chip. (node 1468:25528)
5. **NTP with multiple images + text + Create Image**: Multiple thumbnails, prompt text, blue submit button active. (node 1468:25529)

### Tools Menu Dropdown States

6. **Tools menu - Create Image only**: Single item "Create Image" with subtitle "Turn text into images", highlighted in blue. (node 1617:7173)
7. **Tools menu - Create Image + Web Search**: Two items — "Create Image" (Turn text into images) highlighted, "Web Search" (Find current information). (node 1468:25518)
8. **Tools menu - Create Image selected (checked)**: Checkmark on "Create Image", "Web Search" below unselected. (node 1468:25576)

### Component States

9. **"Create Image x" chip**: Three states — Default (light bg), Hover (slightly darker), On-Click (darker still). (node 1703:6670)
10. **Placeholder text changes**:
    - Default chat: "Ask anything privately"
    - Create Image active: "Describe the image you want to create"
    - Create Image + reference image: "Describe changes based on the image"

### Duck.ai Sidebar States (context only, not NTP-specific)

11. **Sidebar with Tools button**: Shows attach, tools icon, "Tools" label, model selector. (node 1468:25522)
12. **Sidebar with Create Image + images**: Reference images attached, "Create Image x" chip active. (node 1468:25523)

## Test Scenarios

### Default State
- [x] Omnibar is visible on the NTP with placeholder "Ask anything privately"
- [x] "Tools" button is visible in the omnibar action bar (with settings/tools icon and "Tools" label)
- [x] Attach icon is visible to the left of the Tools button
- [x] Model selector dropdowns are visible on the right side
- [x] Submit arrow is visible on the far right

### Tools Menu - Opening & Content
- [x] Clicking "Tools" button opens a dropdown menu
- [x] Menu contains "Create Image" item with subtitle "Turn text into images"
- [!] Menu contains "Web Search" item with subtitle "Find current information" — **ACTUAL: subtitle is "Source answers from the web"**
- [x] "Create Image" has an image-generation icon
- [x] "Web Search" has a globe icon
- [-] Clicking outside the menu closes it — not tested (Playwright limitation)
- [x] Pressing Escape closes the menu

### Create Image Mode - Activation
- [x] Clicking "Create Image" in the tools menu activates image-generation mode
- [x] Tools menu closes after selection
- [x] "Create Image x" chip appears in the action bar (dismissible)
- [x] Placeholder text changes to "Describe the image you want to create"
- [x] Tools icon remains visible next to the chip
- [x] Re-opening tools menu shows checkmark on "Create Image"

### Create Image Mode - Deactivation
- [x] Clicking the "x" on the "Create Image" chip deactivates the mode
- [x] Placeholder reverts to "Ask anything privately"
- [x] "Tools" button reappears (chip is removed)
- [x] Re-opening tools menu shows "Create Image" without checkmark

### Web Search - Activation
- [x] Clicking "Web Search" in the tools menu activates web search
- [x] Tools menu closes after selection
- [x] "Web Search x" chip appears as visual indicator
- [x] Re-opening tools menu shows checkmark on "Web Search"

### Web Search - Deactivation
- [x] User can deactivate web search (dismiss chip)
- [x] Visual indicator is removed

### Both Active
- [!] User can activate both "Create Image" and "Web Search" simultaneously — **ACTUAL: They are mutually exclusive. Selecting one deselects the other.**
- [!] Both indicators are visible in the omnibar — **ACTUAL: Only one chip visible at a time**

### Keyboard Navigation
- [x] Tools menu can be opened with keyboard (click on Tools button, then arrow keys work)
- [x] Arrow keys navigate between menu items
- [x] Enter/Space selects a menu item
- [x] Escape closes the menu
- [x] Focus returns to Tools button area after menu closes

### Create Image Chip States
- [x] Default state: light background, readable text
- [x] Hover state: slightly darker background (subtle)
- [x] Click/active state: darker background

### Placeholder Text
- [x] Default (no mode): "Ask anything privately"
- [x] Create Image active (no images): "Describe the image you want to create"

### Feature Flag Behavior
- [x] When enableImageGeneration=false, "Create Image" is not in the tools menu
- [x] When enableWebSearch=false, "Web Search" is not in the tools menu
- [x] When both flags are false, the "Tools" button does not appear

### Visual Match (Figma comparison)
- [x] Default NTP omnibar layout matches Figma (node 1617:7172)
- [!] Tools menu dropdown matches Figma (node 1468:25518) — **Web Search subtitle differs (see below)**
- [x] Tools menu with checkmark matches Figma (node 1468:25576)
- [x] Create Image active state matches Figma (node 1468:25527)
- [x] Create Image chip Default/Hover/Click states match Figma (node 1703:6670)

---

## QA Results

### Passed: 30 / Total: 35

### Failures

| # | Scenario | Expected | Actual |
|---|----------|----------|--------|
| 1 | Web Search subtitle in Tools menu | "Find current information" (per Figma node 1468:25518) | "Source answers from the web" |
| 2 | Both Create Image and Web Search active simultaneously | Both mode and toolChoice active at once (per task spec) | Mutually exclusive — selecting one deselects the other |
| 3 | Both indicators visible in omnibar | Two chips/indicators shown | Only one chip at a time |

### Blocked

| # | Scenario | Reason |
|---|----------|--------|
| 1 | Click outside menu to close | Playwright accessibility-based testing limitation — cannot click "empty space" reliably |

### Figma Discrepancies

| # | Screen/State | Element | Design Says | Actual | Severity |
|---|-------------|---------|-------------|--------|----------|
| 1 | Tools menu (node 1468:25518) | Web Search subtitle | "Find current information" | "Source answers from the web" | High — wrong copy |
| 2 | Create Image active (node 1:15266) | Model selector | Visible ("Fast", "4o-mini") | Hidden when Create Image mode is active | Medium — may be intentional for image-gen mode |
| 3 | Tools menu behavior | Mutual exclusivity | Task spec says both can be active | Tools are mutually exclusive (radio behavior) | High — spec/implementation mismatch |

Severity guide:
- Critical: missing element, wrong flow, broken interaction
- High: wrong label/copy, wrong icon, invisible text, wrong order
- Medium: wrong color, wrong font size, missing state variant
- Low: spacing off, alignment slightly off, mock data artifacts

### Console Errors (feature-related only)
- None. All 3 console errors are pre-existing infrastructure issues (404 for timestamp.json and mock favicon URL).

### Verdict

**The feature mostly works well but has blockers to review before shipping:**

1. **High: Web Search subtitle mismatch** — The implementation shows "Source answers from the web" but the Figma desktop design (node 1468:25518) specifies "Find current information". The mobile design (node 1801:9283) uses yet another copy: "Source answers from the web". Clarify with design which copy is correct for the NTP.

2. **High: Mutual exclusivity of tools** — The task spec explicitly states users should be able to activate both "Create Image" and "Web Search" simultaneously, with both `mode` and `toolChoice` included in the payload. The current implementation treats them as mutually exclusive (radio-button behavior). This needs a product decision — either update the spec to reflect the current behavior, or update the implementation to allow both.

3. **Medium: Model selector hidden in Create Image mode** — When Create Image is active, the model selector disappears. One Figma state (node 1:15266) shows it visible, while another (node 1468:25527) shows it hidden. Clarify intended behavior with design.

All other functionality works correctly: feature flags, keyboard navigation, placeholder text changes, chip dismiss, menu open/close, checkmark states, and visual styling closely match the Figma design.
