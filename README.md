# AnnotaLoop

AI-assisted document annotation with human-in-the-loop workflows.

## Download

Download the latest installer for your platform from the [Releases page](https://github.com/tayyab-nlp/AnnotaLoop/releases):

- **macOS**: `anotaloopv2_x.x.x_aarch64.dmg` (Apple Silicon) or `anotaloopv2_x.x.x_x64.dmg` (Intel)
- **Windows**: `anotaloopv2_x.x.x_x64-setup.exe`
- **Linux**: `anotaloopv2_x.x.x_amd64.AppImage` or `.deb`

## Development

### Prerequisites

- Node.js (LTS)
- Rust (stable)
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `librsvg2-dev`, `patchelf`, `libxdo-dev`
  - **Windows**: WebView2 (usually pre-installed)

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Creating a New Release

Follow these steps to publish a new version with automatic updates:

### 1. Update Version

Edit `src-tauri/tauri.conf.json`:

```json
{
  "version": "0.2.0"  // Increment version
}
```

### 2. Commit Changes

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### 3. Create and Push Tag

**IMPORTANT**: The tag must start with `app-v` to trigger the release workflow.

```bash
# Create tag matching the version in tauri.conf.json
git tag app-v0.2.0

# Push the tag to GitHub
git push origin app-v0.2.0
```

### 4. Monitor Build

1. Go to [GitHub Actions](https://github.com/tayyab-nlp/AnnotaLoop/actions)
2. Wait for the "Release" workflow to complete (~5-10 minutes)
3. All 4 jobs must succeed (macOS x2, Windows, Ubuntu)

### 5. Publish Release

1. Go to [Releases](https://github.com/tayyab-nlp/AnnotaLoop/releases)
2. Find the draft release
3. Click **Edit**
4. Add release notes describing changes
5. Click **Publish release**

## Auto-Updates

The app checks for updates automatically on startup. When a new version is available:

- A blue banner appears at the top
- Users can click **"Update now"** to download and install
- The app restarts automatically after update

## Signing Keys

**CRITICAL**: Keep these secure and never lose them!

- **Private Key**: `~/.tauri/annotaloop.key`
- **Password**: `annotaloop2024`

These are stored as GitHub Secrets:
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

Without these, you cannot sign future updates and the auto-updater will break.

## Project Structure

```
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
├── src-tauri/           # Tauri backend (Rust)
│   ├── src/             # Rust code
│   └── tauri.conf.json  # Tauri configuration
└── .github/workflows/   # CI/CD automation
```

## Troubleshooting

### Build Fails on CI

1. Check [Actions logs](https://github.com/tayyab-nlp/AnnotaLoop/actions) for errors
2. Verify GitHub Secrets are set correctly
3. Ensure version in `tauri.conf.json` matches the tag

### Local Build Fails

```bash
# Clean and rebuild
rm -rf node_modules dist src-tauri/target
npm install
npm run tauri build
```

### Updates Not Working

1. Verify signing keys haven't changed
2. Check `tauri.conf.json` has correct public key
3. Ensure `latest.json` exists in GitHub release assets

## License

[Your License Here]
