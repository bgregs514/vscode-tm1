import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as tm1Core from "../core/classDefs";
import * as tm1CoreDefs from "../core/classDefs";
import * as tm1NetDefs from "../net/netDefs";
import * as tm1Notify from "../core/notify"

/*
* createNewDocument: On TreeView selection change, create a new tab for the TM1 object and display it
* with the appropriate language file
*/
export function createNewDocument(type: string, tm1Content: string): Thenable<vscode.TextEditor>
{
	/* Well shit...can't actually change the tab names (yet): https://github.com/microsoft/vscode/issues/41909 */

	var options = {
		content: tm1Content,
		language: type == "rule" ? "tm1rule" : "tm1process"
	};
	
	return vscode.workspace.openTextDocument(options).then(document => {
		return vscode.window.showTextDocument(document);
	});
}

export function openNewDocument(fileName: string)
{
	var localWorkspace: string = path.resolve(tm1CoreDefs.GlobalVars.g_Config.localWorkspace!);

	var file = path.join(localWorkspace, fileName);
	vscode.workspace.openTextDocument(file).then(document => {
		vscode.window.showTextDocument(document);
	});
}

/*
* getTM1Object: Assemble the apiCall, retrieve data from the TM1 instance, and create a new document
*/
export function getTM1Object(type: string, queryObj?: string): Promise<string>
{
	var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject();

	if (type == "rule") {
		req.apiCall = "Cubes('" + queryObj + "')?$select=Rules";
	} else {
		req.apiCall = "Processes('" + queryObj + "')?$select=Code";
	}

	return req.execute().then(response => {
		var content;
		if (type == "rule") {
			content = response.Rules!;
		} else {
			content = response.Code!;
		}
		return content;
	});
}

/*
* sendTM1Object: Sends a rule or process object to the TM1 instance
*/
export function sendTM1Object(fileName: string)
{	
        var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject(undefined, tm1NetDefs.TM1APIMethod.PATCH);
	var dataObj = {};
	var type = path.parse(fileName).ext;
	var queryObj = path.parse(fileName).name;

	getFileData(fileName).then((data) => {
		if (Object.values(tm1CoreDefs.TM1RuleExt).some((v) => v === type)) {
			req.apiCall = "Cubes('" + queryObj + "')";
			dataObj = {
				Rules: data
			};
		} else {
			req.apiCall = "Processes('" + queryObj + "')";
			dataObj = {
				Code: data
			}
		}
	
		dataObj = JSON.stringify(dataObj);
		req.execute(dataObj).then(() => {
			tm1Notify.notifySuccess(queryObj + " " + type + " saved successfully!")
		}).catch(error => {
		        console.log(error);
		});
	});
}

function getFileData(fileName: string): Promise<any>
{
	var localWorkspace: string = path.resolve(tm1CoreDefs.GlobalVars.g_Config.localWorkspace!);
	var file = path.join(localWorkspace, fileName);
	console.log(file);

	return new Promise<any>((resolve, reject) => {
		return fs.readFile(file, "utf-8", (error, data) =>
			error ? reject(error) : resolve(data));
	});
}

export function runTM1Process(queryObj: string)
{
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Running " + queryObj,
		cancellable: true
	}, (progress, token) => {
		token.onCancellationRequested(() => {
			/* TODO: Implement function to cancel TM1 thread */
			console.log("Attempting to cancel TM1 process");
		});

		var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject(undefined, tm1NetDefs.TM1APIMethod.POST);
		req.apiCall = "Processes('" + queryObj + "')/tm1.ExecuteWithReturn";
	
		return req.execute().then((response) => {
			var message = queryObj + " returned with: " + response.ProcessExecuteStatusCode;
			if (response.ProcessExecuteStatusCode == "CompletedSuccessfully") {
				tm1Notify.notifySuccess(message);
			} else {
				tm1Notify.notifyError(message);
			}
		}).catch(error => {
			console.log(error);
		});
	});
}

/*
* refreshTreeView: Refreshes a given ObjectProviders data
*/
export function refreshTreeView(objectProvider: tm1Core.TM1ObjectProvider)
{
	objectProvider.refresh();
}