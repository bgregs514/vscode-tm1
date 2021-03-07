import * as vscode from 'vscode';
import {GlobalVars} from "./core/classDefs";
import * as init from "./core/init"

GlobalVars.g_OpenDocuments = [];

/*
* activate: The main VS Code extension function; where it all starts
*/
export function activate(context: vscode.ExtensionContext)
{
	init.initVars();
	init.registerCommands();
	init.setupObjectLists();
}

/*
* deactivate: Leaving here for now, probably won't need this though
*/
export function deactivate() {}