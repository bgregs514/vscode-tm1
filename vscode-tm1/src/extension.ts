import * as vscode from 'vscode';
import * as init from "./core/init"

/*
* activate: The main VS Code extension function; where it all starts
*/
export function activate(context: vscode.ExtensionContext)
{
	init.initVars(context);
	init.openStartupPage();
	init.registerCommands();
	init.initExt();
}

/*
* deactivate: Leaving here for now, probably won't need this though
*/
export function deactivate() {}