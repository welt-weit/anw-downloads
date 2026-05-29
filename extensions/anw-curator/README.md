# ANW Curator

A small Chrome/Edge (Manifest V3) extension for sending selected text and the
current page to Action Network World for curation.

## Install (load unpacked)

1. Download `anw-curator-v0.1.0.zip` from the [Releases page](https://github.com/welt-weit/anw-downloads/releases) and unzip it — or clone this repo and use this folder directly.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `anw-curator` folder.
5. Click the toolbar icon → **Options** (or right-click the icon → Options) → paste your `anw_…` token → **Save**. Hit **Test token** to confirm it's valid.

## Use

- **Toolbar button** — click the icon. The popup shows the current page URL, any selected text, and an optional note. Review, then **Send**.
- **Right-click** — select text on a page, right-click → **Send selection to ANW**. Submits immediately with a notification.
- **Keyboard** — `Ctrl+Shift+A` (`Cmd+Shift+A` on macOS) submits the current selection instantly. Remap under `chrome://extensions/shortcuts`.

For container apps (Slack, Discord, Notion, Gmail, …) the bare page URL isn't
useful, so the popup will ask you to select the relevant text first.

## How it works

`background.js` (the service worker) owns all network calls and POSTs to
`https://api.actionnetwork.world/webhooks/curated`. Because that host is declared
in `host_permissions`, requests are real (no `no-cors` workaround) and error
bodies (400/401/422/…) are surfaced to the user via notifications or the popup.

The API token is the curator's own, entered at runtime and stored only in
`chrome.storage.local` (this browser, this profile). It is never bundled in the
extension.

## Permissions

| Permission              | Why                                                                 |
| ----------------------- | ------------------------------------------------------------------- |
| `activeTab` + `scripting` | Read the current tab's URL and text selection on user action.     |
| `contextMenus`          | The right-click "Send selection to ANW" entry.                      |
| `storage`               | Persist the API token locally.                                      |
| `notifications`         | Success/failure toasts for the right-click and keyboard paths.      |
| `host_permissions` (api.actionnetwork.world) | Real cross-origin POST with readable responses. |

## Files

```
manifest.json   MV3 manifest
background.js    Service worker — fetch, context menu, keyboard command
popup.html/.js   Toolbar popup (review-before-send)
options.html/.js Token entry + "Test token"
icons/           16 / 48 / 128 px (placeholder blue squares — replace before any public listing)
```

## Status

v0.1.0 — Phases 1–2 (scaffold + core flow) complete. Not yet done: badge
counter, submission history, and the release build script / GitHub Action.
