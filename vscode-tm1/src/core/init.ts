import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as tm1Core from "../core/core"
import * as tm1CoreDefs from "../core/classDefs";
import * as tm1NetDefs from "../net/netDefs";
import * as tm1Net from "../net/net";
import * as connectionManager from "./../connectionManager";

/*
* initVars: Initialize global variables and other misc. things that don't belong in registerCommands
*/
export function initVars()
{
	/* g_OpenDocuments */
        tm1CoreDefs.GlobalVars.g_OpenDocuments = [];

        /* g_Config */
        tm1CoreDefs.GlobalVars.g_Config = <tm1NetDefs.TM1Config>{};
        tm1Net.initTM1Config();

	/* g_isLoadLocalWorkspace */
	tm1CoreDefs.GlobalVars.g_isLoadLocalWorkspace = false;
}

/*
* registerCommands: Register commands that the user (or another extension) may want to call directly
*/
export function registerCommands()
{
	/* TODO: Tree view refresh command */
	//vscode.commands.registerCommand("vscode-tm1.refreshView", () => {setupObjectLists});

	/* Tree view item save command */
	vscode.commands.registerCommand("vscode-tm1.saveObject", (viewItem) => {
                var document = tm1Core.getDocument(viewItem.Name);
		if (!document) {
			return;
		}
                tm1Core.sendTM1Object(document.type, document.name, document.docHandle.getText());
        });

	/* Process commands */
	vscode.commands.registerCommand("vscode-tm1.runProcess", (viewItem) => {
		//console.log(viewItem);
		tm1Core.runTM1Process(viewItem.Name);
	});

	/* Connection Manager commands */
	vscode.commands.registerCommand("vscode-tm1.openAddConnectionScreen", () => {connectionManager.openConnectionSettings()});
	vscode.commands.registerCommand("vscode-tm1.refreshConnectionView", () => {connectionManager.listConnections()});
}

/*
* setupObjectLists: Define TreeView configs and structure
*/
export function setupObjectLists()
{
	var apiConfigs: tm1NetDefs.TM1ReqObject[] = [];
	var viewConfigs: tm1CoreDefs.TM1ViewConfig[] = [];
	
	/* Cube View */
	var cubApiConfig: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject();
	cubApiConfig.apiCall = "Cubes?$select=Name";
	apiConfigs.push(cubApiConfig);

	var cubViewConfig: tm1CoreDefs.TM1ViewConfig = {
		viewName: "cubList",
		language: "rule"
	};
	viewConfigs.push(cubViewConfig);

	/* Process View */
	var procApiConfig: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject();
	procApiConfig.apiCall = "Processes?$select=Name";
	apiConfigs.push(procApiConfig);

	var procViewConfig: tm1CoreDefs.TM1ViewConfig = {
		viewName: "procList",
		language: "process"
	};
	viewConfigs.push(procViewConfig);

	/* Create views */
	for (var i = 0; i < apiConfigs.length; i++) {
		createTreeView(viewConfigs[i], apiConfigs[i]);
	}
}

export function openStartupPage()
{
	var startupPath = path.join(__dirname, '..', '..', 'src', 'core', 'startupPage.txt');
	vscode.workspace.openTextDocument(vscode.Uri.file(startupPath)).then((document) => {
		vscode.window.showTextDocument(document);
	});
}

/*
* createTreeView: Create a TreeView with provided configs and attach an onDidChangeSelection event listener
*/
function createTreeView(viewConfig: tm1CoreDefs.TM1ViewConfig, tm1ReqObject: tm1NetDefs.TM1ReqObject)
{
	var view = new tm1CoreDefs.TM1ViewHelper(viewConfig.viewName, tm1ReqObject);

	view.treeView.onDidChangeSelection(() => {
		var selection = view.treeView.selection;
		
		tm1Core.getTM1Object(viewConfig.language, selection[0].Name).then(content => {
			if (tm1Core.getDocument(selection[0].Name)) {
				 return;
			}
                        tm1Core.createNewDocument(viewConfig.language, content).then(() => {
                                tm1Core.updateOpenDocuments(viewConfig.language, selection[0].Name);
                                tm1Core.refreshTreeView(view.dataProvider);
                        });
                });
	});
}

function isLocalWorkspaceExists(localWorkspace: string): boolean
{
	return fs.existsSync(localWorkspace!);
}

function isLocalWorkspaceEmpty(localWorkspace: string): boolean
{
	return fs.readdirSync(localWorkspace!).length === 0;
}

export function initLocalWorkspace()
{
	var config: tm1NetDefs.TM1Config = tm1CoreDefs.GlobalVars.g_Config;
	var localWorkspace = config.localWorkspace;

	/* Assign user directory default if not Local Workspace specified */
	if (localWorkspace == "") {
		localWorkspace = path.join(os.homedir(), '.vscode-tm1');
		tm1CoreDefs.GlobalVars.g_Config.localWorkspace = localWorkspace;
	}
	console.log("Local Workspace: " + localWorkspace);

	/* Create local workspace if it doesn't exist */
	if (!isLocalWorkspaceExists(localWorkspace!)) {
		fs.mkdirSync(localWorkspace!);
	}

	/* Load the local workspace from TM1 if it is empty */
	if (isLocalWorkspaceEmpty(localWorkspace!)) {
		tm1CoreDefs.GlobalVars.g_isLoadLocalWorkspace = true;
	}
}