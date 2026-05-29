# anw-downloads

Public release artifacts for the ANW desktop app, plus the source for the **ANW Curator** browser extension.

This repo serves two purposes:

1. **Desktop installer mirror.** It hosts signed installer binaries on a public URL so the in-app auto-updater (which runs without GitHub authentication on end-user machines) can fetch them. The desktop app's *source* stays private in [`welt-weit/anw-desktop`](https://github.com/welt-weit/anw-desktop) — only its build artifacts are mirrored here.
2. **Curator extension source + distribution.** The ANW Curator browser extension lives in [`extensions/anw-curator/`](extensions/anw-curator/) and is distributed as a `.zip` from this repo's GitHub Releases. Its source is public on purpose: it's a small client-side JavaScript tool with no embedded secrets (the API token is the user's own, entered at runtime), so there's nothing to hide — and being JS, it's inspectable regardless of where it's hosted.

## Why a separate repo?

The source code lives in [`welt-weit/anw-desktop`](https://github.com/welt-weit/anw-desktop), which is private. Tauri's updater plugin makes anonymous HTTP requests to `releases/latest/download/latest.json` from installed user machines — those requests can't authenticate, so a private repo returns 404 to them. By mirroring release artifacts to this public repo, the updater can fetch what it needs without exposing source.

## ANW Curator browser extension

A Manifest V3 extension for sending selected text + the current page to ANW for curation. Source lives in [`extensions/anw-curator/`](extensions/anw-curator/); packaged builds ship as `anw-curator-v*.zip` on the [Releases page](https://github.com/welt-weit/anw-downloads/releases) (tagged `curator-v*`, separate from the desktop app).

**Install (Chrome/Edge, load unpacked):**

1. Download `anw-curator-v0.1.2.zip` from Releases and **unzip** it (Chrome loads a folder, not the zip).
2. **Move the folder somewhere permanent** (e.g. `~/anw-curator/`) — *not* Downloads or a temp dir. Chrome reads it from that path on every launch, so moving or deleting it breaks the extension. (Cloned the repo? Just point at [`extensions/anw-curator/`](extensions/anw-curator/) directly.)
3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, select the `anw-curator` folder.
4. Click the toolbar icon → **Options** → paste your `anw_…` API token → **Save** → **Test token**.

Updating later: replace the folder's contents with the new version (or `git pull`), then hit **reload ↻** on `chrome://extensions`. Your saved token persists.

Then use the toolbar button (review-before-send), the right-click **Send selection to ANW**, or `Ctrl/Cmd+Shift+A`. Full details in the [extension README](extensions/anw-curator/README.md).

## Download links

These URLs always serve the latest published release — safe to embed on landing pages, in emails, in onboarding docs:

- **macOS (Apple Silicon)** — [`ANW.Desktop_aarch64.dmg`](https://github.com/welt-weit/anw-downloads/releases/latest/download/ANW.Desktop_aarch64.dmg)
- **macOS (Intel)** — [`ANW.Desktop_x64.dmg`](https://github.com/welt-weit/anw-downloads/releases/latest/download/ANW.Desktop_x64.dmg)
- **Linux (x86_64, AppImage)** — [`ANW.Desktop_amd64.AppImage`](https://github.com/welt-weit/anw-downloads/releases/latest/download/ANW.Desktop_amd64.AppImage)
- **Windows (x86_64)** — [`ANW.Desktop_x64-setup.exe`](https://github.com/welt-weit/anw-downloads/releases/latest/download/ANW.Desktop_x64-setup.exe)

Versioned filenames (e.g. `ANW.Desktop_0.0.17_aarch64.dmg`) are also attached to each release for traceability. Linux Debian/Ubuntu users can grab the versioned `.deb`; Fedora/RHEL users the `.rpm` — both from the [release page](https://github.com/welt-weit/anw-downloads/releases/latest).

## Per-platform install notes

### macOS

Open the `.dmg`, drag **ANW Desktop** into Applications. The bundle is Apple-signed + notarised — no Gatekeeper override needed. The in-app updater downloads and installs new versions automatically; you'll see a "Restart to apply" prompt when one is ready.

### Linux

**AppImage** (recommended, distro-agnostic) is a self-contained portable runnable — no install required, no root needed:

```bash
chmod +x ANW.Desktop_amd64.AppImage
./ANW.Desktop_amd64.AppImage
```

The in-app auto-updater replaces the AppImage in place.

**Debian/Ubuntu** (`.deb`):
```bash
sudo dpkg -i ANW.Desktop_0.0.17_amd64.deb
```

**Fedora/RHEL** (`.rpm`):
```bash
sudo rpm -i ANW.Desktop-0.0.17-1.x86_64.rpm
```

`.deb` and `.rpm` installs do NOT participate in the in-app updater — re-download from this page when a new release ships. Use the AppImage if you want zero-friction updates.

### Windows

**Heads-up: SmartScreen will warn on first install.** The installer is currently unsigned (no Authenticode certificate — accepted trade-off vs. ~$300+/yr EV cert cost). When you double-click `ANW.Desktop_x64-setup.exe`:

1. Windows shows "Windows protected your PC" with a small **More info** link.
2. Click **More info** → **Run anyway**.
3. The installer runs in passive mode and lands the app under `%LOCALAPPDATA%\ANW Desktop\` — no UAC prompt, no admin needed (per-user install).
4. After install, the in-app auto-updater downloads and installs new versions silently in the background. SmartScreen typically does NOT re-prompt for in-place upgrades from the same publisher.

If your IT policy blocks unsigned installers, you'll need to whitelist this binary or wait for a future signed release.

## What's in each release

End-user installers (versioned + stable aliases):

| File                                       | Platform                | Purpose                              |
| ------------------------------------------ | ----------------------- | ------------------------------------ |
| `ANW.Desktop_<version>_aarch64.dmg`        | macOS Apple Silicon     | Installer (versioned)                |
| `ANW.Desktop_aarch64.dmg`                  | macOS Apple Silicon     | Installer (stable alias)             |
| `ANW.Desktop_<version>_x64.dmg`            | macOS Intel             | Installer (versioned)                |
| `ANW.Desktop_x64.dmg`                      | macOS Intel             | Installer (stable alias)             |
| `ANW.Desktop_<version>_amd64.AppImage`     | Linux x86_64            | Portable runnable (versioned)        |
| `ANW.Desktop_amd64.AppImage`               | Linux x86_64            | Portable runnable (stable alias)     |
| `ANW.Desktop_<version>_amd64.deb`          | Linux (Debian/Ubuntu)   | Native `.deb` package                |
| `ANW.Desktop-<version>-1.x86_64.rpm`       | Linux (Fedora/RHEL)     | Native `.rpm` package                |
| `ANW.Desktop_<version>_x64-setup.exe`      | Windows x86_64          | NSIS installer (versioned)           |
| `ANW.Desktop_x64-setup.exe`                | Windows x86_64          | NSIS installer (stable alias)        |

Auto-updater payloads (the running app fetches these directly — no need to download manually):

| File                              | Platform     | Notes                                    |
| --------------------------------- | ------------ | ---------------------------------------- |
| `*.app.tar.gz` + `.app.tar.gz.sig`| macOS        | Per-arch tarball + minisign signature    |
| `*.AppImage` + `.AppImage.sig`    | Linux        | The AppImage is its own updater payload  |
| `*-setup.exe` + `-setup.exe.sig`  | Windows      | The NSIS installer is its own payload    |
| `*.deb.sig` / `*.rpm.sig`         | Linux pkg    | Signatures for the native packages       |
| `latest.json`                     | All          | Update manifest the auto-updater fetches |

Other:

| File                              | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `anw-desktop-rust-sbom.cdx.json`  | Software Bill of Materials (CycloneDX, Rust deps)|

## How releases get here

A GitHub Actions job in `welt-weit/anw-desktop` builds, signs (where applicable), and notarises (macOS) each release, then mirrors all artifacts here. See [`welt-weit/anw-desktop/docs/DEPLOYMENT.md`](https://github.com/welt-weit/anw-desktop/blob/main/docs/DEPLOYMENT.md) for the full release runbook.

Manual edits to the **desktop** releases are unsupported — they'll get overwritten by the next mirror run for the same tag. (Curator extension releases use their own `curator-v*` tags and are not touched by the desktop mirror.)

## Verifying integrity

**macOS** installers are:

1. **Signed** with `Developer ID Application: Frank Mueller (CY8BS8Z3GB)`. Verify with `spctl --assess --type install /Applications/ANW\ Desktop.app` → should report `Notarized Developer ID`.
2. **Notarised** by Apple. The notarisation ticket is stapled to the `.app` bundle so verification works offline.

**Linux + Windows** auto-update payloads are signed with a minisign keypair whose public key is embedded in the running app. The updater verifies signatures before installing any update.

**Windows first-install** is the only platform where the binary has no chain of trust at the OS level — that's the SmartScreen warning you see. After install, updates ride the same minisign-verified channel as the other platforms.

## Security

Found a vulnerability in the app? See [security policy in the source repo](https://github.com/welt-weit/anw-desktop/blob/main/SECURITY.md). Don't open public issues for security reports.
