import * as vscode from 'vscode';
import { RepoTabManager } from './RepoTabManager';
import { StatusBarManager } from './StatusBarManager';
import { getConfig } from './types';

let repoTabManager: RepoTabManager;
let statusBarManager: StatusBarManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('RepoTabs: Activating...');

    const config = getConfig();
    if (!config.enabled) {
        console.log('RepoTabs: Disabled via config');
        return;
    }

    // Initialize managers
    repoTabManager = new RepoTabManager(context);
    await repoTabManager.initialize();

    statusBarManager = new StatusBarManager(repoTabManager);

    // Set context for keybinding conditions
    await vscode.commands.executeCommand('setContext', 'repoTabs.active', true);

    // ─────────────────────────────────────────────────────────────
    // Register Commands
    // ─────────────────────────────────────────────────────────────

    // Switch to tab 1-9
    for (let i = 1; i <= 9; i++) {
        context.subscriptions.push(
            vscode.commands.registerCommand(`repoTabs.switchToTab${i}`, async () => {
                await repoTabManager.switchToTabByIndex(i - 1);
            })
        );
    }

    // Switch by click (from status bar)
    context.subscriptions.push(
        vscode.commands.registerCommand('repoTabs.switchToTabByClick', async (tabId: string) => {
            await repoTabManager.switchToTab(tabId);
        })
    );

    // Next/Previous tab
    context.subscriptions.push(
        vscode.commands.registerCommand('repoTabs.nextTab', async () => {
            await repoTabManager.nextTab();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('repoTabs.previousTab', async () => {
            await repoTabManager.previousTab();
        })
    );

    // Show all files (disable tab isolation temporarily)
    context.subscriptions.push(
        vscode.commands.registerCommand('repoTabs.showAllFiles', async () => {
            vscode.window.showInformationMessage(
                'RepoTabs: Showing all workspace files. Switch tabs to re-isolate.'
            );
        })
    );

    // Refresh tabs
    context.subscriptions.push(
        vscode.commands.registerCommand('repoTabs.refresh', () => {
            repoTabManager.refresh();
            statusBarManager.refresh();
            vscode.window.showInformationMessage('RepoTabs: Refreshed');
        })
    );

    // ─────────────────────────────────────────────────────────────
    // Event Listeners
    // ─────────────────────────────────────────────────────────────

    // Track file opens
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
            if (editor?.document.uri.scheme === 'file') {
                repoTabManager.onFileOpened(editor.document.uri);
            }
        })
    );

    // Track file closes
    context.subscriptions.push(
        vscode.window.tabGroups.onDidChangeTabs((event: vscode.TabChangeEvent) => {
            for (const closedTab of event.closed) {
                if (closedTab.input instanceof vscode.TabInputText) {
                    repoTabManager.onFileClosed(closedTab.input.uri);
                }
            }
        })
    );

    // Track workspace folder changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            repoTabManager.syncWithWorkspace();
        })
    );

    // Track config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
            if (e.affectsConfiguration('repoTabs')) {
                statusBarManager.refresh();
            }
        })
    );

    // ─────────────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────────────

    context.subscriptions.push({
        dispose: () => {
            statusBarManager.dispose();
            repoTabManager.dispose();
        },
    });

    console.log(`RepoTabs: Activated with ${repoTabManager.getTabCount()} tabs`);

    // Show welcome message on first use
    const hasShownWelcome = context.globalState.get<boolean>('repoTabs.welcomeShown');
    if (!hasShownWelcome && repoTabManager.getTabCount() > 1) {
        vscode.window.showInformationMessage(
            `RepoTabs: ${repoTabManager.getTabCount()} repos detected! Use Cmd+1-9 to switch.`,
            'Got it'
        );
        context.globalState.update('repoTabs.welcomeShown', true);
    }
}

export function deactivate(): void {
    vscode.commands.executeCommand('setContext', 'repoTabs.active', false);
    console.log('RepoTabs: Deactivated');
}
