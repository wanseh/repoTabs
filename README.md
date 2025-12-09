# RepoTabs

Browser-style workspace tabs for VS Code / Cursor. Isolate editors, explorer focus, and state per repository in multi-root workspaces.

## Features

- **Repo Tabs in Status Bar** - Visual tabs for each workspace folder
- **Editor Isolation** - Each repo remembers its own open files
- **State Persistence** - Tabs and open editors persist across sessions
- **Keyboard Shortcuts** - `Cmd+1-9` (Mac) / `Ctrl+1-9` (Win/Linux) to switch
- **Explorer Focus** - Automatically focuses explorer on the active repo
- **Git Integration** - Shows branch name and dirty status per repo
- **Quick Open Filtering** - `Cmd+P` / `Ctrl+P` filters files to the active repository

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
$(folder) my-api | $(folder) my-frontend | $(folder) scripts
     ^        ^          ^           ^
     |        |          |           |
   icon     name      icon        name
```

- **Active tab** is highlighted
- Shows **icon** and **repo name** only
- **Hover** to see full path, git branch, open files, and keyboard shortcut

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `repoTabs.enabled` | `true` | Enable/disable the extension |
| `repoTabs.autoSwitchOnFileOpen` | `false` | Auto-switch when opening a file from another repo |
| `repoTabs.preserveEditorsAcrossTabs` | `false` | Keep editors open when switching (only change focus) |
| `repoTabs.autoFocusExplorer` | `false` | Auto collapse/expand folders in explorer when switching tabs (only if sidebar is open) |

## Commands

| Command | Description |
|---------|-------------|
| `RepoTabs: Switch to Tab 1-9` | Switch to specific tab |
| `RepoTabs: Next Tab` | Switch to next tab |
| `RepoTabs: Previous Tab` | Switch to previous tab |
| `RepoTabs: Refresh Tabs` | Refresh tabs from workspace |
| `RepoTabs: Quick Open (Filtered to Active Repo)` | Open Quick Open filtered to active repository |

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

MIT License

Copyright (c) 2025 WansehDev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Contributing

Issues and PRs welcome!
