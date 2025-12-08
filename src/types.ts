import * as vscode from 'vscode';

export interface RepoTab {
    /** Unique identifier */
    id: string;
    /** Display name (folder name) */
    name: string;
    /** Absolute path to the workspace folder */
    folderPath: string;
    /** Workspace folder URI string */
    folderUri: string;
    /** URIs of open editors (saved state) */
    openEditors: string[];
    /** URI of the last active editor */
    activeEditor: string | null;
    /** View state for each editor (scroll position, etc.) */
    viewStates: Record<string, EditorViewState>;
    /** Git branch name (if available) */
    gitBranch: string | null;
    /** Whether this repo has uncommitted changes */
    gitDirty: boolean;
    /** Icon emoji based on project type */
    icon: string;
}

export interface EditorViewState {
    cursorPosition: { line: number; character: number };
    scrollTop: number;
}

export interface PersistedState {
    version: number;
    tabs: RepoTab[];
    activeTabId: string | null;
}

export interface RepoTabsConfig {
    enabled: boolean;
    autoSwitchOnFileOpen: boolean;
    preserveEditorsAcrossTabs: boolean;
}

export function getConfig(): RepoTabsConfig {
    const config = vscode.workspace.getConfiguration('repoTabs');
    return {
        enabled: config.get<boolean>('enabled', true),
        autoSwitchOnFileOpen: config.get<boolean>('autoSwitchOnFileOpen', false),
        preserveEditorsAcrossTabs: config.get<boolean>('preserveEditorsAcrossTabs', false),
    };
}

export const STATE_VERSION = 1;
export const STATE_KEY = 'repoTabs.state.v1';

