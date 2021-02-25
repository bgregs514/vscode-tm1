import * as vscode from 'vscode';
import {TM1ObjectProvider, GlobalVars} from "./classDefs";
import {tm1RestCall} from "./netDefs";

GlobalVars.g_OpenDocuments = [];

/*
* activate: The main VS Code extension function; where it all starts
*/
export function activate(context: vscode.ExtensionContext)
{
	registerCommands(context);
	initVars();
	setupObjectLists();
}

/*
* initVars: Initialize global variables and other misc. things that don't belong in registerCommands
*/
function initVars()
{
	/* Move g_OpenDocuments to the global context for use in package.json */
	vscode.commands.executeCommand("setContext", "vscode-tm1:openDocuments", GlobalVars.g_OpenDocuments);
}

/*
* registerCommands: Register commands that the user (or another extension) may want to call directly
*/
function registerCommands(context: vscode.ExtensionContext)
{
	/* TODO: Tree view refresh command */
	//vscode.commands.registerCommand("vscode-tm1.refreshView", () => {setupObjectLists});

	/* Tree view item save command */
	vscode.commands.registerCommand("vscode-tm1.saveObject", () => {console.log("saved")});
}

/*
* setupObjectLists: Create the TreeViews that contain the Cube and Process object lists
*/
function setupObjectLists()
{
	let apiCall = "Cubes?$select=Name";

	const objectProvider = new TM1ObjectProvider(apiCall);
	const cubList = vscode.window.createTreeView("cubList", {
		canSelectMany: false,
		showCollapseAll: true,
		treeDataProvider: objectProvider
	});
	cubList.onDidChangeSelection(() => {
		var selection = cubList.selection;
		
		setEditorText("rule", selection[0].Name);
		updateOpenDocuments(selection[0].Name, objectProvider);
	});

	/* TODO: Disabling TIs for now; need to focus just on rules to get the base working */
	//apiCall = "Processes?$select=Name";
	// tm1RestCall(apiCall, "GET").then(response => {
	// 	const procList = vscode.window.createTreeView("procList", {
	// 		canSelectMany: false,
	// 		showCollapseAll: true,
	// 		treeDataProvider: new TM1ObjectProvider([response.value][0])
	// 	});
	// 	procList.onDidChangeSelection(() => {
	// 		setEditorText("proc", procList.selection[0].Name);
	// 	});
	// });
}

/*
* updateOpenDocuments: Adjust g_OpenDocuments to account for changes, and refresh the TM1ObjectProvider
* to display the "Save" icon
*/
function updateOpenDocuments(selectionName: string, objectProvider: TM1ObjectProvider)
{
	GlobalVars.g_OpenDocuments.push(selectionName);
	objectProvider.refresh();
}

/*
* createNewDocument: On TreeView selection change, create a new tab for the TM1 object and display it
* with the appropriate language file
*/
function createNewDocument(type: string, tm1Content: string)
{
	/* Well shit...can't actually change the tab names (yet): https://github.com/microsoft/vscode/issues/41909 */

	var options = {
		content: tm1Content,
		language: type == "rule" ? "tm1rule" : "tm1process"
	};

	vscode.workspace.openTextDocument(options).then(document => {
		vscode.window.showTextDocument(document);
	});
}

/*
* setEditorText: Assemble the apiCall, retrieve data from the TM1 instance, and create a new document
*/
function setEditorText(type: string, queryObj?: string)
{
	let apiCall = "";
	if (type == "rule") {
		apiCall = "Cubes('" + queryObj + "')?$select=Rules";
	} else {
		apiCall = "Processes('" + queryObj + "')";
	}

	tm1RestCall(apiCall, "GET").then(response => {
		var content;
		if (type == "rule") {
			content = response.Rules!;
		} else {
			content = response.PrologProcedure!;
		}
		
		createNewDocument(type, content);
	});
}

/*
* deactivate: Leaving here for now, probably won't need this though
*/
export function deactivate() {}