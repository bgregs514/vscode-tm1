import * as vscode from 'vscode';
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
                tm1Core.sendTM1Object(document.type, document.name, document.docHandle.getText());
        });

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

/*
* createTreeView: Create a TreeView with provided configs and attach an onDidChangeSelection event listener
*/
function createTreeView(viewConfig: tm1CoreDefs.TM1ViewConfig, tm1ReqObject: tm1NetDefs.TM1ReqObject)
{
	var view = new tm1CoreDefs.TM1ViewHelper(viewConfig.viewName, tm1ReqObject);

	view.treeView.onDidChangeSelection(() => {
		var selection = view.treeView.selection;
		
		tm1Core.getTM1Object(viewConfig.language, selection[0].Name).then(content => {
			var docExist = tm1Core.getDocument(selection[0].Name);
			if (docExist.name != undefined) {
				 return;
			}
                        tm1Core.createNewDocument(viewConfig.language, content).then(() => {
                                tm1Core.updateOpenDocuments(viewConfig.language, selection[0].Name);
                                tm1Core.refreshTreeView(view.dataProvider);
                        });
                });
	});
}