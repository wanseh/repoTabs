import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RepoTab, PersistedState, STATE_KEY, STATE_VERSION, getConfig } from './types';

export class RepoTabManager {
    private tabs: RepoTab[] = [];
    private activeTabId: string | null = null;
    private context: vscode.ExtensionContext;
    private isSwitching = false;

    private readonly _onDidChange = new vscode.EventEmitter<void>();
    readonly onDidChange = this._onDidChange.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async initialize(): Promise<void> {
        // Load persisted state
        await this.loadState();

        // Sync with current workspace folders
        this.syncWithWorkspace();

        // If no active tab but we have tabs, select first
        if (!this.activeTabId && this.tabs.length > 0) {
            this.activeTabId = this.tabs[0].id;
        }

        this.emit();
    }

    /**
     * Sync tabs with current workspace folders
     * Now scans subdirectories within workspace roots to find repos
     */
    syncWithWorkspace(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders || [];
        const discoveredRepos = new Set<string>();

        // For each workspace folder, scan subdirectories for repos
        for (const workspaceFolder of workspaceFolders) {
            const repoPaths = this.discoverReposInFolder(workspaceFolder.uri.fsPath);
            for (const repoPath of repoPaths) {
                discoveredRepos.add(repoPath);
            }
        }

        // Add new repos as tabs
        for (const repoPath of discoveredRepos) {
            const exists = this.tabs.find(t => t.folderPath === repoPath);
            if (!exists) {
                this.tabs.push(this.createTabFromPath(repoPath));
            }
        }

        // Remove tabs for repos that no longer exist
        this.tabs = this.tabs.filter(tab => {
            // Keep tab if the folder still exists and is still a valid repo
            if (!fs.existsSync(tab.folderPath)) return false;
            if (!this.isRepo(tab.folderPath)) return false;
            // Check if it's still within any workspace folder
            return workspaceFolders.some((f: vscode.WorkspaceFolder) => 
                tab.folderPath.startsWith(f.uri.fsPath)
            );
        });

        // Update icons for all existing tabs
        for (const tab of this.tabs) {
            tab.icon = this.detectProjectIcon();
        }

        // Update git status for all tabs
        this.updateAllGitStatus();

        this.saveState();
        this.emit();
    }

    /**
     * Discover repos (subdirectories) within a workspace folder
     */
    private discoverReposInFolder(workspacePath: string): string[] {
        const repos: string[] = [];
        
        try {
            if (!fs.existsSync(workspacePath)) return repos;
            
            const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
            
            for (const entry of entries) {
                // Skip hidden folders and common non-repo folders
                if (entry.name.startsWith('.') || 
                    entry.name === 'node_modules' || 
                    entry.name === 'out' ||
                    entry.name === 'dist' ||
                    entry.name === 'build') {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    const subfolderPath = path.join(workspacePath, entry.name);
                    if (this.isRepo(subfolderPath)) {
                        repos.push(subfolderPath);
                    }
                }
            }
        } catch {
            // Ignore fs errors
        }
        
        return repos;
    }

    /**
     * Check if a folder is a repo (has .git, package.json, or other indicators)
     */
    private isRepo(folderPath: string): boolean {
        try {
            // Check for .git (most reliable indicator)
            if (fs.existsSync(path.join(folderPath, '.git'))) return true;
            
            // Check for package.json (Node.js project)
            if (fs.existsSync(path.join(folderPath, 'package.json'))) return true;
            
            // Check for other common project files
            if (fs.existsSync(path.join(folderPath, 'Cargo.toml'))) return true; // Rust
            if (fs.existsSync(path.join(folderPath, 'go.mod'))) return true; // Go
            if (fs.existsSync(path.join(folderPath, 'pyproject.toml'))) return true; // Python
            if (fs.existsSync(path.join(folderPath, 'requirements.txt'))) return true; // Python
            if (fs.existsSync(path.join(folderPath, 'pom.xml'))) return true; // Java Maven
            if (fs.existsSync(path.join(folderPath, 'build.gradle'))) return true; // Java Gradle
            if (fs.existsSync(path.join(folderPath, 'Gemfile'))) return true; // Ruby
            if (fs.existsSync(path.join(folderPath, 'angular.json'))) return true; // Angular
            if (fs.existsSync(path.join(folderPath, 'next.config.js')) || 
                fs.existsSync(path.join(folderPath, 'next.config.mjs'))) return true; // Next.js
            
            return false;
        } catch {
            return false;
        }
    }

    private createTabFromPath(folderPath: string): RepoTab {
        const folderName = path.basename(folderPath);
        const folderUri = vscode.Uri.file(folderPath).toString();
        
        return {
            id: `repo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: folderName,
            folderPath: folderPath,
            folderUri: folderUri,
            openEditors: [],
            activeEditor: null,
            viewStates: {},
            gitBranch: null,
            gitDirty: false,
            icon: this.detectProjectIcon(),
        };
    }

    private detectProjectIcon(): string {
        return '$(folder)';
    }

    private async updateAllGitStatus(): Promise<void> {
        for (const tab of this.tabs) {
            await this.updateGitStatus(tab);
        }
    }

    private async updateGitStatus(tab: RepoTab): Promise<void> {
        try {
            const gitDir = path.join(tab.folderPath, '.git');
            if (!fs.existsSync(gitDir)) {
                tab.gitBranch = null;
                tab.gitDirty = false;
                return;
            }

            // Read current branch
            const headPath = path.join(gitDir, 'HEAD');
            if (fs.existsSync(headPath)) {
                const head = fs.readFileSync(headPath, 'utf8').trim();
                if (head.startsWith('ref: refs/heads/')) {
                    tab.gitBranch = head.replace('ref: refs/heads/', '');
                } else {
                    tab.gitBranch = head.substring(0, 7); // Detached HEAD
                }
            }

            // Check for uncommitted changes via git status
            // This is a simple check - just look if there are changes in the index
            const indexPath = path.join(gitDir, 'index');
            const indexStat = fs.existsSync(indexPath) ? fs.statSync(indexPath) : null;
            
            // Use VS Code's built-in git extension if available
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension?.isActive) {
                const git = gitExtension.exports.getAPI(1);
                const repo = git.repositories.find((r: any) => 
                    r.rootUri.fsPath === tab.folderPath
                );
                if (repo) {
                    const state = repo.state;
                    tab.gitDirty = state.workingTreeChanges.length > 0 || 
                                   state.indexChanges.length > 0;
                }
            }
        } catch {
            // Ignore git errors
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────

    getTabs(): RepoTab[] {
        return [...this.tabs];
    }

    getActiveTab(): RepoTab | undefined {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    getActiveTabId(): string | null {
        return this.activeTabId;
    }

    getTabCount(): number {
        return this.tabs.length;
    }

    /**
     * Switch to a specific tab by ID
     */
    async switchToTab(tabId: string): Promise<void> {
        if (this.isSwitching) return;
        if (tabId === this.activeTabId) return;

        const targetTab = this.tabs.find(t => t.id === tabId);
        if (!targetTab) return;

        this.isSwitching = true;
        const config = getConfig();

        try {
            // Save current tab's state
            const currentTab = this.getActiveTab();
            if (currentTab) {
                await this.saveCurrentEditorState(currentTab);
            }

            // Close editors if not preserving
            if (!config.preserveEditorsAcrossTabs) {
                await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            }

            // Switch active tab
            this.activeTabId = tabId;

            // Restore target tab's editors
            await this.restoreEditors(targetTab);

            // Focus explorer on the repo folder
            await this.focusExplorerOnRepo(targetTab);

            // Update git status
            await this.updateGitStatus(targetTab);

            this.saveState();
            this.emit();
        } finally {
            this.isSwitching = false;
        }
    }

    /**
     * Switch to tab by index (0-based)
     */
    async switchToTabByIndex(index: number): Promise<void> {
        if (index >= 0 && index < this.tabs.length) {
            await this.switchToTab(this.tabs[index].id);
        }
    }

    /**
     * Switch to next tab (cyclic)
     */
    async nextTab(): Promise<void> {
        if (this.tabs.length === 0) return;
        const currentIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        await this.switchToTab(this.tabs[nextIndex].id);
    }

    /**
     * Switch to previous tab (cyclic)
     */
    async previousTab(): Promise<void> {
        if (this.tabs.length === 0) return;
        const currentIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
        const prevIndex = currentIndex <= 0 ? this.tabs.length - 1 : currentIndex - 1;
        await this.switchToTab(this.tabs[prevIndex].id);
    }

    /**
     * Track when a file is opened - associate with current tab
     */
    onFileOpened(uri: vscode.Uri): void {
        if (this.isSwitching) return;

        const activeTab = this.getActiveTab();
        if (!activeTab) return;

        const config = getConfig();

        // Check if file belongs to a different repo
        if (config.autoSwitchOnFileOpen) {
            const owningTab = this.findTabForFile(uri);
            if (owningTab && owningTab.id !== activeTab.id) {
                this.switchToTab(owningTab.id);
                return;
            }
        }

        // Add to current tab's open editors
        const uriString = uri.toString();
        if (!activeTab.openEditors.includes(uriString)) {
            activeTab.openEditors.push(uriString);
            this.saveState();
            this.emit();
        }
    }

    /**
     * Track when a file is closed
     */
    onFileClosed(uri: vscode.Uri): void {
        if (this.isSwitching) return;

        const uriString = uri.toString();
        for (const tab of this.tabs) {
            const index = tab.openEditors.indexOf(uriString);
            if (index !== -1) {
                tab.openEditors.splice(index, 1);
                delete tab.viewStates[uriString];
            }
        }
        this.saveState();
        this.emit();
    }

    /**
     * Find which tab owns a file
     */
    findTabForFile(uri: vscode.Uri): RepoTab | undefined {
        return this.tabs.find(tab => uri.fsPath.startsWith(tab.folderPath));
    }

    /**
     * Refresh all tabs from workspace
     */
    refresh(): void {
        this.syncWithWorkspace();
    }

    // ─────────────────────────────────────────────────────────────
    // Editor State Management
    // ─────────────────────────────────────────────────────────────

    private async saveCurrentEditorState(tab: RepoTab): Promise<void> {
        const openFiles: string[] = [];

        // Collect all open text editors
        for (const group of vscode.window.tabGroups.all) {
            for (const vsTab of group.tabs) {
                if (vsTab.input instanceof vscode.TabInputText) {
                    const uri = vsTab.input.uri;
                    // Only save files that belong to this repo
                    if (uri.fsPath.startsWith(tab.folderPath)) {
                        openFiles.push(uri.toString());
                    }
                }
            }
        }

        tab.openEditors = openFiles;

        // Save active editor
        if (vscode.window.activeTextEditor) {
            const activeUri = vscode.window.activeTextEditor.document.uri;
            if (activeUri.fsPath.startsWith(tab.folderPath)) {
                tab.activeEditor = activeUri.toString();

                // Save view state
                const editor = vscode.window.activeTextEditor;
                tab.viewStates[activeUri.toString()] = {
                    cursorPosition: {
                        line: editor.selection.active.line,
                        character: editor.selection.active.character,
                    },
                    scrollTop: editor.visibleRanges[0]?.start.line ?? 0,
                };
            }
        }
    }

    private async restoreEditors(tab: RepoTab): Promise<void> {
        // Open saved editors
        for (const uriString of tab.openEditors) {
            try {
                const uri = vscode.Uri.parse(uriString);
                if (fs.existsSync(uri.fsPath)) {
                    await vscode.window.showTextDocument(uri, {
                        preview: false,
                        preserveFocus: true,
                    });
                }
            } catch {
                // File may have been deleted
            }
        }

        // Restore active editor and position
        if (tab.activeEditor) {
            try {
                const uri = vscode.Uri.parse(tab.activeEditor);
                if (fs.existsSync(uri.fsPath)) {
                    const editor = await vscode.window.showTextDocument(uri, {
                        preview: false,
                        preserveFocus: false,
                    });

                    // Restore cursor position
                    const viewState = tab.viewStates[tab.activeEditor];
                    if (viewState) {
                        const position = new vscode.Position(
                            viewState.cursorPosition.line,
                            viewState.cursorPosition.character
                        );
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(
                            new vscode.Range(position, position),
                            vscode.TextEditorRevealType.InCenter
                        );
                    }
                }
            } catch {
                // Ignore errors
            }
        }
    }

    private async focusExplorerOnRepo(tab: RepoTab): Promise<void> {
        try {
            const folderUri = vscode.Uri.file(tab.folderPath);
            
            await vscode.commands.executeCommand('workbench.files.action.focusFilesExplorer');
            await vscode.commands.executeCommand('workbench.files.action.collapseExplorerFolders');
            
            // Wait for collapse to complete
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Reveal and expand the active repo folder
            await vscode.commands.executeCommand('revealInExplorer', folderUri);
            await new Promise(resolve => setTimeout(resolve, 100));
            await vscode.commands.executeCommand('list.expand');
        } catch {
            // Ignore if explorer commands are unavailable
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Persistence
    // ─────────────────────────────────────────────────────────────

    private async loadState(): Promise<void> {
        try {
            const state = this.context.workspaceState.get<PersistedState>(STATE_KEY);
            if (state && state.version === STATE_VERSION) {
                this.tabs = state.tabs || [];
                this.activeTabId = state.activeTabId;
            }
        } catch {
            // Start fresh on error
            this.tabs = [];
            this.activeTabId = null;
        }
    }

    private saveState(): void {
        const state: PersistedState = {
            version: STATE_VERSION,
            tabs: this.tabs,
            activeTabId: this.activeTabId,
        };
        this.context.workspaceState.update(STATE_KEY, state);
    }

    private emit(): void {
        this._onDidChange.fire();
    }

    dispose(): void {
        this._onDidChange.dispose();
    }
}

