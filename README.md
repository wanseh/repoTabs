# RepoTabs

Browser-style workspace tabs for VS Code / Cursor. Isolate editors, explorer focus, and state per repository in multi-root workspaces.

## Features

- **🗂️ Repo Tabs in Status Bar** - Visual tabs for each workspace folder
- **📑 Editor Isolation** - Each repo remembers its own open files
- **🔄 State Persistence** - Tabs and open editors persist across sessions
- **⌨️ Keyboard Shortcuts** - `Cmd+1-9` (Mac) / `Ctrl+1-9` (Win/Linux) to switch
- **📍 Explorer Focus** - Automatically focuses explorer on the active repo
- **🔀 Git Integration** - Shows branch name and dirty status per repo
- **🎨 Project Icons** - Auto-detects project type (Angular, Node, Python, etc.)

## How It Works

When you switch repo tabs:

1. **Saves** current open editors and cursor positions
2. **Closes** all editors (configurable)
3. **Restores** saved editors for the target repo
4. **Focuses** explorer on that repo's folder

This gives you a "browser tab" experience where each repo has its own isolated workspace.

## Installation

### From VSIX (Development)

```bash
cd repoTab
npm install
npm run compile
npm run package
```

Then install the `.vsix` file:
- Open Command Palette (`Cmd+Shift+P`)
- Run "Extensions: Install from VSIX..."
- Select the generated `.vsix` file

### From Source (Development)

1. Open this folder in VS Code / Cursor
2. Run `npm install`
3. Press `F5` to launch Extension Development Host

## Usage

### Switching Tabs

| Shortcut | Action |
|----------|--------|
| `Cmd+1` / `Ctrl+1` | Switch to Repo Tab 1 |
| `Cmd+2` / `Ctrl+2` | Switch to Repo Tab 2 |
| ... | ... |
| `Cmd+9` / `Ctrl+9` | Switch to Repo Tab 9 |
| `Ctrl+Tab` | Next Tab |
| `Ctrl+Shift+Tab` | Previous Tab |

### Status Bar

Tabs appear in the left side of the status bar:

```
[1] 📦 my-api (3) main● | [2] 🅰️ my-frontend (5) dev | [3] 🐍 scripts
     ^    ^     ^   ^          ^        ^
     |    |     |   |          |        |
   index icon name files    branch   dirty
```

- **Active tab** is highlighted
- **File count** shows open editors in that tab
- **Git branch** and dirty indicator (●) if available

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `repoTabs.enabled` | `true` | Enable/disable the extension |
| `repoTabs.showFileCount` | `true` | Show open file count in tabs |
| `repoTabs.autoSwitchOnFileOpen` | `false` | Auto-switch when opening a file from another repo |
| `repoTabs.preserveEditorsAcrossTabs` | `false` | Keep editors open when switching (only change focus) |
| `repoTabs.showGitStatus` | `true` | Show git branch/status on tabs |

## Commands

| Command | Description |
|---------|-------------|
| `RepoTabs: Switch to Tab 1-9` | Switch to specific tab |
| `RepoTabs: Next Tab` | Switch to next tab |
| `RepoTabs: Previous Tab` | Switch to previous tab |
| `RepoTabs: Refresh Tabs` | Refresh tabs from workspace |

## Project Icons

RepoTabs auto-detects project types and shows appropriate icons:

| Icon | Project Type |
|------|-------------|
| 🅰️ | Angular |
| ▲ | Next.js |
| 💚 | Nuxt |
| 🔥 | Svelte |
| ⚡ | Vite |
| 📦 | Node.js |
| 🦀 | Rust |
| 🐹 | Go |
| 🐍 | Python |
| ☕ | Java |
| 💎 | Ruby |
| 📁 | Git repo |
| 📂 | Folder |

## Known Limitations

1. **Cursor Compatibility**: This extension is designed to work in both VS Code and Cursor. However, some features may behave slightly differently in Cursor.

2. **Large Workspaces**: With many workspace folders (10+), the status bar may become crowded. Consider using keyboard shortcuts instead.

3. **Explorer Filtering**: The extension focuses the explorer on the active repo but doesn't hide other folders (VS Code API limitation).

## Troubleshooting

### Tabs not appearing

1. Make sure you have a multi-root workspace (2+ folders)
2. Check that `repoTabs.enabled` is `true` in settings
3. Try running "RepoTabs: Refresh Tabs" command

### Shortcuts not working

1. Check for conflicting keybindings in Keyboard Shortcuts
2. Make sure `repoTabs.active` context is set (visible in status bar)

### Files not restoring

Files that have been deleted won't restore. The extension silently skips missing files.

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Package for distribution
npm run package
```

## License

MIT

## Contributing

Issues and PRs welcome!
