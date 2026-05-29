# ANW Curator

A small Chrome/Edge (Manifest V3) extension for sending selected text and the
current page to Action Network World for curation.

## Install (load unpacked)

Chrome installs this from a **folder**, not the zip — and it reads that folder
from disk every time the browser starts. So the folder has to live somewhere
permanent.

1. Download `anw-curator-v0.1.0.zip` from the [Releases page](https://github.com/welt-weit/anw-downloads/releases) and **unzip it**. (You can't pick the `.zip` directly in Chrome — it needs the unzipped folder.)
2. **Move the unzipped `anw-curator` folder to a permanent location** — e.g. `~/anw-curator/` or inside `~/Documents/`. **Not** Downloads, Desktop-temp, or `/tmp`: if the folder is later moved, renamed, or deleted, the extension breaks on the next browser launch ("manifest file is missing or unreadable") and disappears.
3. Open `chrome://extensions` (or `edge://extensions`).
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select that `anw-curator` folder.
6. Click the toolbar icon → **Options** (or right-click the icon → Options) → paste your `anw_…` token → **Save**. Hit **Test token** to confirm it's valid.

> Already cloned this repo? Skip the download — point **Load unpacked** straight
> at this folder. It's permanent, and `git pull` updates it in place.

## Updating to a new version

The folder is loaded by path, so updating means replacing its contents, not
re-installing:

1. Download the new zip, unzip it, and **replace the contents of the same folder** (or `git pull` if you loaded from a clone).
2. Go to `chrome://extensions` and click the **reload ↻** icon on the ANW Curator card.

Your saved token lives in `chrome.storage.local` and survives reloads and
version bumps — you won't need to re-enter it.

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
