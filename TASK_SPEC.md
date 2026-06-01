# Attach Tabs & Files in New Tab Page

| | |
|---|---|
| **Feature** | Attach one or more open tabs (and PDF files) to a Duck.ai chat from the New Tab Page omnibar |
| **Feature flag** | `enableAttachTabs` (tab attachment) · PDF attachment gated per-model by `supportedFileTypes` |
| **Platform** | Desktop — macOS (primary), Windows (native bridge in progress) |
| **Design** | [Figma: Desktop – Attach tabs (All inputs)](https://www.figma.com/design/c1D1uEZt217Y8Zbk2fcd16/Desktop---Attach-tabs--All-inputs-?node-id=1-877&m=dev) |
| **Asana** | [Frontend: Attach 1 or more tabs in New Tab Page](https://app.asana.com/1/137249556945/project/72649045549333/task/1214227868283289) |

## What Is This?

The New Tab Page (NTP) omnibar already lets you start a Duck.ai chat from a fresh
tab. This feature adds a way to bring extra context into that chat **before you
send it**:

- **Attach open tabs** — pick one or more of your currently open browser tabs,
  and their page content rides along with your prompt so Duck.ai can answer about
  them (e.g. "compare these two laptops").
- **Attach PDF files** — attach a PDF from your computer the same way, for models
  that support file input.

Attachments show up as removable **chips** above the omnibar input. You can add
several, remove any of them, and then submit the chat with everything attached.

This brings the NTP omnibar in line with the other places Duck.ai already lives
(the sidebar and the in-browser omnibar), so the attach experience feels the same
everywhere.

## Why?

- As Duck.ai grows from single-page help toward multi-source tasks (comparison,
  synthesis, planning), the "current tab only" model is too limiting.
- Users already think of their open tabs as a working set — this gives them a
  first-class way to express "use these."
- Shipping it now establishes a consistent foundation across all desktop entry
  points before usage scales further.

## User Flows

### Flow A — Attach tabs via the paperclip menu

1. User opens a New Tab Page and focuses the omnibar in AI/Duck.ai mode.
2. User clicks the **paperclip** entry point.
3. A picker opens listing the user's open tabs (most recent first; the NTP tab
   itself is not listed).
4. User selects a tab.
5. The page content for that tab is extracted and a **chip** (title + favicon)
   appears above the input.
6. User repeats to attach more tabs.
7. User types a prompt and submits — the chat is sent with all attached tab
   contexts.

### Flow B — Attach tabs via `@` mention

1. In the omnibar, user types the `@` character.
2. A typeahead appears, filtering the same open-tab list as the user keeps typing.
3. User picks a tab from the typeahead.
4. A chip is added (same as Flow A), and the user continues their prompt and
   submits.

### Flow C — Attach a PDF file

1. User clicks the paperclip entry point (shown only when the active model accepts
   files).
2. User chooses a PDF from the system file picker.
3. A chip with the file name appears above the input.
4. User submits — the chat is sent with the PDF attached.

### Flow D — Remove an attachment

1. User clicks the remove control on any chip (tab or file).
2. The chip disappears and that context is dropped from the next submit.

## Key Behaviors

| Behavior | Expected outcome |
|---|---|
| Open the picker (paperclip or `@`) | Shows the list of open tabs, most-recently-used first |
| The current NTP tab | Never appears in the tab list |
| `@` typeahead | Filters the same tab list as the paperclip picker, on the client |
| Select a tab | Extracts that tab's page content and renders a chip |
| Submit with N tab chips | All N tab contexts are sent with the chat |
| Select a PDF | Reads + encodes the file in the page and renders a named chip |
| Submit with a PDF chip | The PDF is sent with the chat |
| Remove a chip | That attachment is dropped from the next submit |
| Multiple attachments | Tabs and files can be combined in a single submit |

## Edge Cases & Error Handling

| Scenario | Expected behavior |
|---|---|
| `enableAttachTabs` is off / absent | Paperclip and `@` typeahead for tabs are hidden; existing omnibar flows are unchanged |
| Active model does not accept files | The file/paperclip entry for PDFs is hidden (driven by the model's `supportedFileTypes`) |
| Selected tab is closed, restricted, or content can't be extracted | No content is returned for that tab; it does not produce a usable chip |
| User switches to a model that can't handle an already-attached file type | The unsupported file attachment is cleared |
| Switch between browser tabs while NTP is open | Attached chips persist (per-tab state) |
| NTP tab is closed | Attached chips are cleared |
| Submit with no attachments | Behaves exactly as today — no attachment data is added to the chat |

## Platform Support

| Platform | Status |
|---|---|
| Frontend (NTP web layer) | In scope — picker UI, chips, `@` typeahead, file read/encode |
| macOS (native bridge) | In scope |
| Windows (native bridge) | Planned / in progress |
| iOS / Android | Not in scope (desktop NTP feature) |

## What's NOT in Scope (v1)

- Server-side / native-side tab filtering or search — all filtering (including the
  `@` typeahead) happens client-side over the returned tab list.
- File types other than **PDF** — v1 only sends PDFs, though the design leaves room
  to add more types later.
- A master on/off switch for PDF support — file attachment is enabled per-model, not
  via a single global flag.
- Image attachment changes — images already work today and are unchanged here.

## Testing Notes

**Tabs (frontend):**
- Picker populates the tab list on open.
- `@`-typeahead filters the same list client-side.
- Selecting a tab extracts content and renders a chip.
- Removing a chip drops that context from the next submit.
- A closed/broken tab yields no usable content.
- Submitting with N chips includes N tab contexts in the submitted chat.
- With `enableAttachTabs` absent/false, the paperclip and `@` typeahead are hidden
  and existing flows are unchanged.
- Per-tab state: chips persist across browser-tab switches and clear when the NTP
  tab closes.

**Files (frontend):**
- The paperclip entry and file-picker `accept` are driven by the active model's
  supported file types; the entry is hidden when none are supported.
- Selecting a file adds a chip; removing it drops the file from the next submit.
- The submitted chat carries files matching the attached chips.
- Switching to a model that doesn't support an attached file's type clears it.

**Mock mode / dev tools:**
- Testable through the existing NTP `mock-transport.js`.
- Enable tab attachment with the query param `?omnibar.enableAttachTabs=true`.
- Mock transport returns a set of mock tabs with a simulated extraction delay.
- For files, any mock model declaring PDF support surfaces the file entry point.

## Open Questions

- **AL1** — Should the native layer enforce a size/count cap on attached files
  before forwarding to Duck.ai, and if so what limit? (Raised in the PDF tech
  design; unresolved.)

## Analytics (TBD)

No pixels/events are defined in the source tasks. The following are candidates that
should be specified before launch:

- Paperclip entry point opened.
- Tab attached (via paperclip vs. `@` mention).
- File (PDF) attached.
- Attachment removed.
- Chat submitted with N tab attachments / with a file attachment.
