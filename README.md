# anw-downloads

Public release artifacts for the ANW desktop app and (future) other ANW installers.

**This repository contains no source code.** It exists to host signed installer binaries on a public URL so the in-app auto-updater (which runs without GitHub authentication on end-user machines) can fetch them.

## Why a separate repo?

The source code lives in [`welt-weit/anw-desktop`](https://github.com/welt-weit/anw-desktop), which is private. Tauri's updater plugin makes anonymous HTTP requests to `releases/latest/download/latest.json` from installed user machines — those requests can't authenticate, so a private repo returns 404 to them. By mirroring release artifacts to this public repo, the updater can fetch what it needs without exposing source.

## Download links

These URLs always serve the latest published release — safe to embed on landing pages, in emails, in onboarding docs:

- **macOS (Apple Silicon)** — [`ANW.Desktop_aarch64.dmg`](https://github.com/welt-weit/anw-downloads/releases/latest/download/ANW.Desktop_aarch64.dmg)
- **macOS (Intel)** — [`ANW.Desktop_x64.dmg`](https://github.com/welt-weit/anw-downloads/releases/latest/download/ANW.Desktop_x64.dmg)
- **Linux (x86_64)** — [`ANW.Desktop_amd64.AppImage`](https://github.com/welt-weit/anw-downloads/releases/latest/download/ANW.Desktop_amd64.AppImage)

Versioned filenames (e.g. `ANW.Desktop_0.0.13_aarch64.dmg`) are also attached to each release for traceability.

**Linux usage:** AppImage is a self-contained portable runnable — no install required, no root needed. After download: `chmod +x ANW.Desktop_amd64.AppImage && ./ANW.Desktop_amd64.AppImage`. The in-app auto-updater replaces the AppImage in place.

## What's in each release

| File | Platform | Purpose |
|---|---|---|
| `ANW.Desktop_<version>_aarch64.dmg` | macOS Apple Silicon | Installer (versioned) |
| `ANW.Desktop_<version>_x64.dmg` | macOS Intel | Installer (versioned) |
| `ANW.Desktop_<version>_amd64.AppImage` | Linux x86_64 | Portable runnable (versioned) |
| `ANW.Desktop_<version>_amd64.deb` | Linux (Debian/Ubuntu) | Native `.deb` package |
| `anw-desktop-<version>-1.x86_64.rpm` | Linux (Fedora/RHEL) | Native `.rpm` package |
| `ANW.Desktop_aarch64.dmg` | macOS Apple Silicon | Installer (stable alias) |
| `ANW.Desktop_x64.dmg` | macOS Intel | Installer (stable alias) |
| `ANW.Desktop_amd64.AppImage` | Linux x86_64 | Portable runnable (stable alias) |
| `*.app.tar.gz` + `.sig` | macOS | Updater payload + minisign signature |
| `*.AppImage.tar.gz` + `.sig` | Linux | Updater payload + minisign signature |
| `latest.json` | All | Update manifest the auto-updater fetches |
| `anw-desktop-rust-sbom.cdx.json` | All | Software Bill of Materials (CycloneDX, Rust deps) |

## How releases get here

A GitHub Actions job in `welt-weit/anw-desktop` builds, signs, and notarises each release, then mirrors all artifacts here. See [`welt-weit/anw-desktop/docs/DEPLOYMENT.md`](https://github.com/welt-weit/anw-desktop/blob/main/docs/DEPLOYMENT.md) for the full release runbook.

Manual edits to this repo's releases are unsupported — they'll get overwritten by the next mirror run for the same tag.

## Verifying integrity

Every macOS installer is:

1. **Signed** with `Developer ID Application: Frank Mueller (CY8BS8Z3GB)`. Verify with `spctl --assess --type install /Applications/ANW\ Desktop.app` → should report `Notarized Developer ID`.
2. **Notarised** by Apple. The notarisation ticket is stapled to the `.app` bundle so verification works offline.

Updater payloads (`.app.tar.gz`) are signed with a minisign keypair whose public key is embedded in the running app. The updater verifies signatures before installing any update.

## Security

Found a vulnerability in the app? See [security policy in the source repo](https://github.com/welt-weit/anw-desktop/blob/main/SECURITY.md). Don't open public issues for security reports.
