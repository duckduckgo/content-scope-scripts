# Tech Design: New Tab Page Omnibar — Support for PDF File Attachment

- **Author:** https://app.asana.com/1/137249556945/profile/1213083311198664
- **Reviewer:** TBD
- **Stakeholders:** TBD
- **Project:** TBD

## Background & Requirements

The NTP omnibar already accepts image attachments through the `images` field on `omnibar_submitChat`. We want to extend it to accept **PDF files** alongside images, surfaced through the same paperclip menu that the tab-attachment feature added.

Duck.ai's prompt API already receives files in a stable shape:

```ts
export type NativePromptFile = { data: string; fileName: string; mimeType: string };
files?: NativePromptFile[];
```

NTP mirrors that shape on the bridge so native forwards entries through unchanged.

## Problem Statement

Native apps need to extend one existing notification with a new `files` field and add a per-model capability flag so the omnibar can attach PDFs and Duck.ai can process them.

## Recommended Approach

No new request/response messages — the file is read and base64-encoded entirely in the web layer (`FileReader.readAsDataURL`). Submission carries the encoded payload alongside any images or page-context attachments.

```
JS                          Native Layer
│                                     │
│  (file picker, read+encode in JS)   │
│                                     │
│  omnibar_submitChat (notify)        │
├────────────────────────────────────►│  Forward files[] to
│  { ..., files: [...] }              │  Duck.ai unchanged
│                                     │
```

### Per-model capability: `supportedFileTypes`

Added to each `AIModelItem` in `aiModelSections`. An array of MIME types the model accepts as file attachments. Empty or omitted means the model does not accept files — the "Add PDFs" entry is hidden, and any already-attached files are cleared on model switch if their MIME isn't in the new model's set. There is no separate master switch; availability is fully derived from the per-model capability, mirroring how `supportsImageUpload` already gates image attachments.

The array (rather than a boolean) is forward-compatible: future models can accept `.txt`, `.docx`, etc. without a schema change, and the file picker's `accept` attribute is driven directly by this array for the currently selected model.

```json
{
  "id": "claude-3-5-sonnet",
  "name": "Claude 3.5 Sonnet",
  "shortName": "Sonnet",
  "isEnabled": true,
  "supportsImageUpload": true,
  "supportedFileTypes": ["application/pdf"]
}
```

### Augmented: `omnibar_submitChat` (notify)

Adds an optional `files` field carrying any PDFs the user attached. Omitted when no files are attached, so existing native handlers continue to work unchanged. Independent of `images` and `pageContext` — all three may appear on the same submission.

**Example payload:**

```json
{
  "chat": "Summarize this report",
  "target": "same-tab",
  "modelId": "claude-3-5-sonnet",
  "files": [
    {
      "data": "JVBERi0xLjQKJ...",
      "fileName": "q3-report.pdf",
      "mimeType": "application/pdf"
    }
  ]
}
```

**Fields:**
- `files` *(`Array<NativePromptFile>`, optional)* — same shape Duck.ai accepts. Omitted when no files are attached.
  - `data` *(string, required)* — Base64-encoded file bytes, no data URL prefix
  - `fileName` *(string, required)* — Original filename, used for display in the chip UI and forwarded to Duck.ai
  - `mimeType` *(string, required)* — MIME type. v1: NTP only sends `application/pdf`. The field is left as an open string (not an enum) to match Duck.ai's input shape and to let additional types be added later without a schema change.

## Implementation Steps (Native)

1. Add `supportedFileTypes: string[]` to each `AIModelItem` returned in `aiModelSections`. v1 sends `["application/pdf"]` for models that accept PDFs; empty/omitted for models that don't. Roll-out is per-model — there is no separate master switch.
2. On `omnibar_submitChat`, read the optional `files` array and forward the entries unchanged into the Duck.ai prompt payload's `files` field.

## Notes

- **Open question — should file-type validation also live in NTP native?** Today validation lives in the web layer: the file input's `accept` attribute is derived from the active model's `supportedFileTypes`, and the upload hook rejects MIME types not in that array before encoding. Schema does not constrain MIME because the field shape mirrors Duck.ai's input. Do we want the NTP native layer to also validate the MIME type when it receives the file, or is trusting the web layer sufficient?
- **Open question — should the size cap live in NTP native?** v1 has no size cap on the JS side beyond what the browser's `FileReader` will accept. Should the NTP native layer enforce a cap before forwarding, and if so what limit?

## Testing

**FE:**
- Paperclip entry and file picker `accept` are driven by the active model's `supportedFileTypes`; entry is hidden when it's empty
- Selecting a file adds a chip; removing it drops the file from the next submit
- `omnibar_submitChat` carries `files` (and `images`/`pageContext`) matching the attached chips
- Switching to a model that doesn't support an attached file's MIME clears it

**Mock transport:** Testable via the existing NTP `mock-transport.js` — any model item declaring `supportedFileTypes: ["application/pdf"]` will surface the entry.

## Additional Considerations (if applicable)

- **Privacy** — TBD
- **Security** — TBD
