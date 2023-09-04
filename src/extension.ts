import * as vscode from 'vscode';
import clipboardy from 'clipboardy';
import { commitTypes } from './commitTypes';

interface CommitType {
    label: string;
    emoji: string;
    description: string;
}

async function selectCommitType(): Promise<CommitType | undefined> {
    const commitTypeOptions = commitTypes.map(type => ({
        label: `${type.emoji} ${type.label} - ${type.description}`,
        type,
    }));

    const selectedOption = await vscode.window.showQuickPick(commitTypeOptions, {
        placeHolder: 'Select the commit type',
    });

    return selectedOption?.type;
}

async function inputCommitMessage(): Promise<string | undefined> {
    const input = await vscode.window.showInputBox({
        placeHolder: 'Enter the commit message (e.g., "Add new feature")',
        validateInput: (input) => {
            return input ? null : 'The commit message cannot be empty';
        },
    });

    return input;
}

async function copyToClipboard(commitMessage: string) {
    clipboardy.writeSync(commitMessage);
    vscode.window.showInformationMessage('Commit copied to the clipboard');
}

async function commitToGitRepository(commitMessage: string) {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    
    if (gitExtension) {
        const gitAPI = gitExtension.exports.getAPI(1);
        if (gitAPI.repositories.length > 0) {
            const activeRepository = gitAPI.repositories[0];
            await activeRepository.commit(commitMessage);
        } else {
            vscode.window.showErrorMessage('No Git repository found.');
        }
    } else {
        vscode.window.showErrorMessage('Git extension not found.');
    }
}

async function createConventionalCommit() {
    const selectedType = await selectCommitType();

    if (!selectedType) {
        return; // User canceled the selection
    }

    const commitMessage = await inputCommitMessage();

    if (!commitMessage) {
        return; // User canceled the commit message input
    }

    const finalCommitMessage = `${selectedType.emoji} ${selectedType.label}: ${commitMessage}`;

    const choice = await vscode.window.showInformationMessage(
        `Do you want to copy the commit message to the clipboard before committing?\n\n"${finalCommitMessage}"`,
        'Copy', 'Commit'
    );

    if (choice === 'Copy') {
        await copyToClipboard(finalCommitMessage);
    } else if (choice === 'Commit') {
        await commitToGitRepository(finalCommitMessage);
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('The "conventional-commit" extension is active.');

    let disposable = vscode.commands.registerCommand('extension.createConventionalCommit', () => {
        createConventionalCommit();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
