import * as vscode from 'vscode';

export function notifySuccess(message: string)
{
        vscode.window.showInformationMessage(message);
}

export function notifyError(message: string)
{
        vscode.window.showErrorMessage(message);
}