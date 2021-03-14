import * as vscode from 'vscode';
import * as init from "./core/init"

/*
* activate: The main VS Code extension function; where it all starts
*/
export function activate(context: vscode.ExtensionContext)
{
	init.initVars();
	init.registerCommands();
	init.setupObjectLists();
	init.openStartupPage();
}

/*
* deactivate: Leaving here for now, probably won't need this though
*/
export function deactivate() {}