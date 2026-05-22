# anw-downloads

Public release artifacts for the ANW desktop app and (future) other ANW installers.

**This repository contains no source code.** It exists to host signed installer binaries on a public URL so the in-app auto-updater (which runs without GitHub authentication on end-user machines) can fetch them.

## Why a separate repo?

The source code lives in [`welt-weit/anw-desktop`](https://github.com/welt-weit/anw-desktop), which is private. Tauri's updater plugin makes anonymous HTTP requests to `releases/latest/download/latest.json` from installed user machines — those requests can't authenticate, so a private repo returns 404 to them. By mirroring release artifacts to this public repo, the updater can fetch what it needs without exposing source.

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

Manual edits to this repo's releases are unsupported — they'll get overwritten by the next mirror run for the same tag.

## Verifying integrity

**macOS** installers are:

1. **Signed** with `Developer ID Application: Frank Mueller (CY8BS8Z3GB)`. Verify with `spctl --assess --type install /Applications/ANW\ Desktop.app` → should report `Notarized Developer ID`.
2. **Notarised** by Apple. The notarisation ticket is stapled to the `.app` bundle so verification works offline.

**Linux + Windows** auto-update payloads are signed with a minisign keypair whose public key is embedded in the running app. The updater verifies signatures before installing any update.

**Windows first-install** is the only platform where the binary has no chain of trust at the OS level — that's the SmartScreen warning you see. After install, updates ride the same minisign-verified channel as the other platforms.

## Security

Found a vulnerability in the app? See [security policy in the source repo](https://github.com/welt-weit/anw-desktop/blob/main/SECURITY.md). Don't open public issues for security reports.
