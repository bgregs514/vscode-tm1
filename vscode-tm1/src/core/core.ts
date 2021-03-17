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
export function getTM1Object(fileString: string): Promise<string>
{
	var fileName: tm1CoreDefs.TM1File = new tm1CoreDefs.TM1File(fileString);
	var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject();

	req.apiCall = fileName.apiPrefix + "('" + fileName.name + "')?$select=" + fileName.apiPostAttr;

	return req.execute().then(response => {
		return response[fileName.apiPostAttr];
	}).catch((error) => {
		console.log(error);
	});
}

/*
* sendTM1Object: Sends a rule or process object to the TM1 instance
*/
export function sendTM1Object(fileString: string)
{	
	var fileName: tm1CoreDefs.TM1File = new tm1CoreDefs.TM1File(fileString);
        var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject(undefined, tm1NetDefs.TM1APIMethod.PATCH);

	getFileData(fileName.fullName).then((data) => {
		var dataObj: Record<string,any> = {};
		dataObj[fileName.apiPostAttr] = data;
		req.apiCall = fileName.apiPrefix + "('" + fileName.name + "')";
		
		var jsonObj = JSON.stringify(dataObj);
		req.execute(jsonObj).then(() => {
			tm1Notify.notifySuccess(fileName.name + " " + fileName.type + " saved successfully!");
		}).catch(error => {
		        console.log(error);
		});
	}).catch((error) => {
		console.log(error);
	});
}

function getFileData(fileString: string): Promise<any>
{
	var localWorkspace: string = path.resolve(tm1CoreDefs.GlobalVars.g_Config.localWorkspace!);
	var file = path.join(localWorkspace, fileString);

	return new Promise<any>((resolve, reject) => {
		return fs.readFile(file, "utf-8", (error, data) =>
			error ? reject(error) : resolve(data));
	});
}

export function runTM1Process(fileString: string)
{
	var fileName: tm1CoreDefs.TM1File = new tm1CoreDefs.TM1File(fileString);

	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Running " + fileName.name,
		cancellable: true
	}, (progress, token) => {
		token.onCancellationRequested(() => {
			/* TODO: Implement function to cancel TM1 thread */
			console.log("Attempting to cancel TM1 process");
		});

		var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject(undefined, tm1NetDefs.TM1APIMethod.POST);
		req.apiCall = fileName.apiPrefix + "('" + fileName.name + "')/tm1.ExecuteWithReturn";
	
		return req.execute().then((response) => {
			var message = fileName.name + " returned with: " + response.ProcessExecuteStatusCode;
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