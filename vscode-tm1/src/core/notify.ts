import * as vscode from 'vscode';

export function notifySuccess(message: string)
{
        vscode.window.showInformationMessage(message);
}