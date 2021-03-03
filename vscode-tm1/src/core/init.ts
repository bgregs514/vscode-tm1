import * as vscode from 'vscode';
import * as tm1CoreDefs from "../core/classDefs";
import {tm1Req} from "../net/netDefs";
import * as tm1Core from "../core/core"
import * as connectionManager from "./../connectionManager";

/*
* initVars: Initialize global variables and other misc. things that don't belong in registerCommands
*/
export function initVars()
{
	/* Move g_OpenDocuments to the global context for use in package.json */
	vscode.commands.executeCommand("setContext", "vscode-tm1:openDocuments", tm1CoreDefs.GlobalVars.g_OpenDocuments);
}

/*
* registerCommands: Register commands that the user (or another extension) may want to call directly
*/
export function registerCommands(context: vscode.ExtensionContext)
{
	/* TODO: Tree view refresh command */
	//vscode.commands.registerCommand("vscode-tm1.refreshView", () => {setupObjectLists});

	/* Tree view item save command */
	vscode.commands.registerCommand("vscode-tm1.saveObject", () => {console.log("saved")});

	vscode.commands.registerCommand("vscode-tm1.openAddConnectionScreen", () => {connectionManager.openConnectionSettings()});
	vscode.commands.registerCommand("vscode-tm1.refreshConnectionView", () => {connectionManager.listConnections()});
}

/*
* setupObjectLists: Define TreeView configs and structure
*/
export function setupObjectLists()
{
	var apiConfigs: tm1Req.TM1ReqObject[] = [];
	var viewConfigs: tm1CoreDefs.TM1ViewConfig[] = [];
	
	/* Cube View */
	var cubApiConfig: tm1Req.TM1ReqObject = new tm1Req.TM1ReqObject();
	cubApiConfig.apiCall = "Cubes?$select=Name";
	apiConfigs.push(cubApiConfig);

	var cubViewConfig: tm1CoreDefs.TM1ViewConfig = {
		viewName: "cubList",
		language: "rule"
	};
	viewConfigs.push(cubViewConfig);

	/* Process View */
	var procApiConfig: tm1Req.TM1ReqObject = new tm1Req.TM1ReqObject();
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
* createTreeView: Create a TreeView with provided configs and attach an event listener
*/
function createTreeView(viewConfig: tm1CoreDefs.TM1ViewConfig, tm1ReqObject: tm1Req.TM1ReqObject)
{
	var view = new tm1CoreDefs.TM1ViewHelper(viewConfig.viewName, tm1ReqObject);

	view.treeView.onDidChangeSelection(() => {
		var selection = view.treeView.selection;
		
		tm1Core.setEditorText(viewConfig.language, selection[0].Name);
		tm1Core.updateOpenDocuments(selection[0].Name, view.dataProvider);
	});
}