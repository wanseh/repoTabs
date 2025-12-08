import * as vscode from 'vscode';
import { RepoTabManager } from './RepoTabManager';
import { RepoTab, getConfig } from './types';

interface TabButton {
    statusBarItem: vscode.StatusBarItem;
    tabId: string;
}

export class StatusBarManager {
    private tabButtons: TabButton[] = [];
    private manager: RepoTabManager;
    private disposables: vscode.Disposable[] = [];

    // Priority ensures tabs appear at far left of status bar
    private static BASE_PRIORITY = 1000;

    constructor(manager: RepoTabManager) {
        this.manager = manager;

        // Listen for changes
        this.disposables.push(
            manager.onDidChange(() => this.refresh())
        );

        // Initial render
        this.refresh();
    }

    refresh(): void {
        const tabs = this.manager.getTabs();
        const activeTabId = this.manager.getActiveTabId();
        const config = getConfig();

        // Dispose old buttons
        this.disposeButtons();

        // Create new buttons for each tab
        tabs.forEach((tab, index) => {
            const isActive = tab.id === activeTabId;
            const button = this.createTabButton(tab, index, isActive, config.showFileCount);
            this.tabButtons.push(button);
        });
    }

    private createTabButton(
        tab: RepoTab,
        index: number,
        isActive: boolean,
        showFileCount: boolean
    ): TabButton {
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            StatusBarManager.BASE_PRIORITY - index
        );

        // Build label
        let label = `${tab.icon} ${tab.name}`;

        // Add file count
        if (showFileCount && tab.openEditors.length > 0) {
            label += ` (${tab.openEditors.length})`;
        }

        // Add git info
        if (tab.gitBranch) {
            const dirtyIndicator = tab.gitDirty ? '●' : '';
            label += ` $(git-branch) ${tab.gitBranch}${dirtyIndicator}`;
        }

        // Add shortcut hint for first 9 tabs
        if (index < 9) {
            label = `[${index + 1}] ${label}`;
        }

        statusBarItem.text = label;
        statusBarItem.tooltip = this.buildTooltip(tab, index);
        statusBarItem.command = {
            command: 'repoTabs.switchToTabByClick',
            title: 'Switch Tab',
            arguments: [tab.id],
        };

        // Style: active vs inactive
        if (isActive) {
            statusBarItem.backgroundColor = new vscode.ThemeColor(
                'statusBarItem.warningBackground'
            );
            statusBarItem.color = new vscode.ThemeColor(
                'statusBarItem.warningForeground'
            );
        } else {
            statusBarItem.backgroundColor = undefined;
            statusBarItem.color = new vscode.ThemeColor('statusBar.foreground');
        }

        statusBarItem.show();

        return { statusBarItem, tabId: tab.id };
    }

    private buildTooltip(tab: RepoTab, index: number): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;

        md.appendMarkdown(`### ${tab.icon} ${tab.name}\n\n`);
        md.appendMarkdown(`📂 \`${tab.folderPath}\`\n\n`);

        if (tab.gitBranch) {
            const status = tab.gitDirty ? '(modified)' : '(clean)';
            md.appendMarkdown(`🔀 **Branch:** ${tab.gitBranch} ${status}\n\n`);
        }

        if (tab.openEditors.length > 0) {
            md.appendMarkdown(`📑 **Open files:** ${tab.openEditors.length}\n\n`);
        }

        if (index < 9) {
            md.appendMarkdown(`⌨️ **Shortcut:** \`Cmd+${index + 1}\` / \`Ctrl+${index + 1}\`\n\n`);
        }

        md.appendMarkdown(`---\n*Click to switch*`);

        return md;
    }

    private disposeButtons(): void {
        for (const button of this.tabButtons) {
            button.statusBarItem.dispose();
        }
        this.tabButtons = [];
    }

    dispose(): void {
        this.disposeButtons();
        for (const d of this.disposables) {
            d.dispose();
        }
    }
}

