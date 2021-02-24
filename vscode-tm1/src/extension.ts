import * as vscode from 'vscode';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import * as https from 'https';
import {TM1Return, TM1ObjectProvider, TM1TreeItem} from "./classDefs";

export function activate(context: vscode.ExtensionContext)
{
	console.log("activated");
	/* Register commands */
	registerCommands(context);

	/* Load the Object List */
	setupObjectLists();

	/* Register text change event */
	vscode.workspace.onDidChangeTextDocument(changeEvent => {
		vscode.commands.executeCommand("setContext", "vscode-tm1:saveObjectIcon", true);
	});
}

function registerCommands(context: vscode.ExtensionContext)
{
	/* TODO: Create object list refresh command */

	/* Register the tree view item save command */
	vscode.commands.registerCommand("vscode-tm1.saveObject", () => {console.log("saved")});
}

function setupObjectLists()
{
	console.log("refreshing");

	let apiCall = "Cubes?$select=Name";
	tm1RestCall(apiCall, "GET").then(response => {
		//console.log([response]["value"]);
		const cubList = vscode.window.createTreeView("cubList", {
			canSelectMany: false,
			showCollapseAll: true,
			treeDataProvider: new TM1ObjectProvider([response.value][0])
		});
		cubList.onDidChangeSelection(() => {
			//console.log(cubList.selection);
			setEditorText("rule", cubList.selection[0].Name);
		});
	});
	apiCall = "Processes?$select=Name";
	tm1RestCall(apiCall, "GET").then(response => {
		const procList = vscode.window.createTreeView("procList", {
			canSelectMany: false,
			showCollapseAll: true,
			treeDataProvider: new TM1ObjectProvider([response.value][0])
		});
		procList.onDidChangeSelection(() => {
			setEditorText("proc", procList.selection[0].Name);
		});
	});
}

function createNewDocument(type: string, tm1Content: string)
{
	/* Well shit...can't actually change the tab names (yet): https://github.com/microsoft/vscode/issues/41909 */

	/* Define the content and language for the new document */
	var options = {
		content: tm1Content,
		language: type == "rule" ? "tm1rule" : "tm1process"
	};

	/* Create the new document and display it */
	vscode.workspace.openTextDocument(options).then(document => {
		vscode.window.showTextDocument(document);
	});
}

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

async function tm1RestCall(apiCall: string, apiType: Method): Promise<TM1Return>
{
	var settings = vscode.workspace.getConfiguration("vscode-tm1");

	var encodedCreds = "CAMNamespace " + Buffer.from(settings.get("username") + ":" + settings.get("password") + ":" + settings.get("namespace")).toString("base64");
	var baseURL = "https://" + settings.get("url") + ":" + settings.get("port") + "/api/v1/";
	
	const config =  {
		httpsAgent: new https.Agent({
			rejectUnauthorized: false,
		}),
		headers: {
			"Content-Type": "application/json",
			"Authorization": encodedCreds
		},
		method: apiType,
		url: encodeURI(baseURL + apiCall)
	};
	
	return axios(config).then(response => {
		console.log(response.data);
		return response.data;
	}).catch(error => {
		console.log(error);
	});
}

export function deactivate() {}