# Attach 1 or More Tabs in New Tab Page

| | |
|---|---|
| **Feature** | Attach open-tab page context (and PDFs/images) to a Duck.ai chat from the New Tab Page omnibar |
| **Native feature flag** | `aiChatNtpAttachMoreTabs` (Debug → Feature Flag Overrides → Duck.ai) |
| **Web config flag** | `enableAttachTabs` (delivered to the page via config; dev override `?omnibar.enableAttachTabs=true`) |
| **Platform** | macOS desktop (primary). Windows in progress. |
| **Design** | [Figma — Desktop: Attach tabs (All inputs)](https://www.figma.com/design/c1D1uEZt217Y8Zbk2fcd16/Desktop---Attach-tabs--All-inputs-?node-id=1-877&m=dev) |
| **Project Advisor** | Tom Strba |
| **Asana** | [Frontend: Attach 1 or more tabs in New Tab Page (1w)](https://app.asana.com/1/137249556945/project/72649045549333/task/1214227868283289) |

---

## What Is This?

The New Tab Page (NTP) has an omnibar that lets you start a Duck.ai chat from a
fresh tab. Today that chat can only see the current page. This feature lets you
**hand Duck.ai content from one or more of your other open tabs** before you ask
your question.

When the feature is on, the omnibar gains a paperclip (attach) button. From there
you can:

- **Attach page content** from any open browser tab. Each attached tab shows up as
  a small "chip" above the text field, with its title and favicon.
- **Type `@`** in the omnibar to search your open tabs inline and attach one
  without leaving the keyboard.
- **Add images or PDFs** as attachments (a separate, related input on the same menu).
- **Browse and remove** anything you've attached before submitting.

When you submit, everything you attached is sent along to Duck.ai so it can answer
using the content of those tabs/files — for example, comparing two products that
are open in two different tabs.

---

## Why?

- Duck.ai is moving from single-page help toward multi-source tasks — comparison,
  synthesis, planning — where "just the current tab" is too limiting.
- Users already treat a set of open tabs as their working set; there was no
  first-class way to express "use these tabs" in a chat.
- Shipping this now sets a principled foundation before usage scales up, and brings
  the NTP omnibar in line with other Duck.ai entry points (sidebar, browser omnibar).

---

## User Flows

### Flow 1 — Attach tabs from the menu

1. User opens a New Tab Page and clicks into the omnibar.
2. User clicks the **paperclip / attach** button.
3. A menu appears with **Attach Page Content** and **Add Images or PDFs**.
4. User chooses **Attach Page Content**; a list of their open tabs appears
   (most recently used first; the New Tab Page's own tab is not listed).
5. User selects one or more tabs. Each becomes a **chip** showing its favicon and title.
6. User types a question and submits. Duck.ai opens with the attached page content.

### Flow 2 — Attach a tab with `@`

1. User clicks into the omnibar and types `@`.
2. An inline picker shows their open tabs and filters as they keep typing
   (matching against tab title/URL).
3. User selects a tab from the list; it's added as a chip just like the menu flow.
4. User finishes their question and submits.

### Flow 3 — Add a PDF or image

1. User clicks the **paperclip** button and chooses **Add Images or PDFs**.
2. User picks one or more files.
3. Each file appears as an attachment chip alongside any attached tabs.
4. User submits; the files are handed to Duck.ai together with any tab content.

### Flow 4 — Review and remove attachments

1. With one or more chips present, the user can read each chip's title/favicon.
2. User removes any chip before submitting.
3. Removed attachments are not included when the chat is submitted.

---

## Key Behaviors

| Behavior | Expected Outcome |
|---|---|
| Feature flag on | Paperclip/attach entry point is visible and `@` typeahead is active in the omnibar |
| Feature flag off / absent | No paperclip, no `@` typeahead; omnibar behaves exactly as before |
| Open the picker (paperclip or `@`) | The list of open tabs loads quickly (metadata only — no page content read yet) |
| Tab list ordering | Tabs shown in most-recently-used order |
| New Tab Page's own tab | Excluded from the list — you can't attach the tab you're typing in |
| Select a tab | Its page content is read and a chip (favicon + title) appears above the input |
| Type `@` then keep typing | The same open-tab list filters live, on-device, as you type |
| Mix attachment types | Tabs, PDFs, and images can be attached together in the same chat |
| Remove a chip | That attachment is dropped and not sent on submit |
| Submit with N chips | All N attachments are handed to Duck.ai with the question |
| Submit with no attachments | Behaves like the existing omnibar chat (nothing extra attached) |

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|---|---|
| Selected tab was closed before content could be read | No chip is added for it; attachment silently fails for that tab, others are unaffected |
| Selected tab is a restricted page (e.g. a system/internal page) | Content can't be read; no chip added for that tab |
| Content extraction fails for any reason | Treated the same as unavailable — no chip for that tab |
| Very long page content | Content may be truncated for the attachment; the chat still receives a usable excerpt |
| Switch between browser tabs while composing | Attached chips persist on the NTP tab across browser tab switches |
| Close the New Tab Page tab | Attached chips for that tab are cleared (attachment state is per-NTP-tab) |
| No other tabs open | Picker shows an empty list; user can still attach files / submit a plain chat |

---

## Platform Support

| Platform | Status |
|---|---|
| macOS desktop | Implemented; in ship review |
| Windows desktop | Native bridge in progress |
| iOS | Not in scope (desktop New Tab Page omnibar feature) |
| Android | Not in scope |

---

## What's NOT in Scope (v1)

- **Server-side / native-side tab filtering.** The full open-tab list is returned and
  all searching (including the `@` typeahead) happens on-device. Smarter native
  filtering can be added later.
- **Remote configuration of attachment limits** (max number of images, max attachment
  size). Deferred to a later stage and tracked separately
  ([Frontend: NTP - Use Duck.ai Attachment Limits Configuration](https://app.asana.com/1/137249556945/project/1211654189969294/task/1215504742109018)).
- **A dedicated PDF attachment tech design / native contract.** Still pending; PDF/image
  support ships as the basic input described above.

---

## Testing Notes

**Enable on a native build (macOS):**
- Use the review build linked in the Ship Review task.
- Turn on **Debug → Feature Flag Overrides → Duck.ai → `aiChatNtpAttachMoreTabs`**.

**Enable in the web/dev environment:**
- Append `?omnibar.enableAttachTabs=true` to the New Tab Page URL.
- The feature can be exercised against the New Tab Page **mock transport**, which
  returns a set of mock open tabs and simulates a content-extraction delay.

**Things to verify:**
- Picker populates the open-tab list when opened via paperclip or `@`.
- `@` typeahead filters that list as you type.
- Selecting a tab renders a chip; removing a chip drops it from the next submit.
- A closed / restricted / broken tab does not produce a chip.
- Submitting with N attachments hands all N to Duck.ai.
- With the flag off, the paperclip and `@` typeahead are hidden and existing flows are unchanged.
- Chips persist across browser tab switches and clear when the NTP tab is closed.
- Tabs, PDFs, and images can be combined in one submission.

---

## Open Questions

- PDF attachment still needs its own tech design / native contract — what are the
  final supported file types and per-file constraints?
- What are the attachment limits (max files, max total size) before remote config
  lands, and what does the user see when they exceed them?
- Windows native bridge timeline and any behavioral differences from macOS.
- Behavior when a very large number of tabs is open — is the list capped or scrolled?

---

## Analytics (TBD)

No pixels/events are defined yet. Candidates worth defining:

- Attach entry point opened (paperclip vs. `@`).
- Attachment added, by type (tab / PDF / image).
- Attachment removed before submit.
- Chat submitted with attachments, including count and type breakdown.
- Attachment failures (tab closed / restricted / extraction failed).
