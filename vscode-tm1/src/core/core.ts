import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as tm1CoreDefs from "../core/classDefs";
import * as tm1NetDefs from "../net/netDefs";
import * as tm1Notify from "../core/notify";
import * as init from "../core/init";

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

export function openNewDocument(fileString: string)
{
	var file = getFilePath(fileString);

	vscode.workspace.openTextDocument(file).then(document => {
		vscode.window.showTextDocument(document).then(() => {
			console.log("formatted");
			vscode.commands.executeCommand("editor.action.formatDocument");
		});
	});
}

/*
* getTM1Object: Assemble the apiCall, retrieve data from the TM1 instance, and create a new document
*/
export function getTM1Object(fileString: string): Promise<string>;
export function getTM1Object(fileString: string, apiParam?: tm1NetDefs.TM1APICalls, retType?: string): Promise<tm1NetDefs.TM1Return>
export function getTM1Object(string: string, arg0?: tm1NetDefs.TM1APICalls, arg1?: string)
{
	var fileName: tm1CoreDefs.TM1File = new tm1CoreDefs.TM1File(string);
	var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject();
	var index: string = "";

	if (!arg0 && !arg1) {
		req.apiCall = fileName.apiPrefix + "('" + fileName.name + "')" + tm1NetDefs.TM1APICalls.default + fileName.apiPostAttr;
		index = fileName.apiPostAttr;
	} else {
		req.apiCall = fileName.apiPrefix + "('" + fileName.name + "')" + arg0;
		index = arg1!;
	}

	return req.execute().then(response => {
		if (!index) {
			return response;
		}
		return response[index];
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
	var file = getFilePath(fileString);

	getFileData(file).then((data) => {
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

export function getFileData(file: string): Promise<any>
{
	return new Promise<any>((resolve, reject) => {
		return fs.readFile(file, "utf-8", (error, data) =>
			error ? reject(error) : resolve(data));
	});
}

function createTM1Object(dataObj: any, type: tm1NetDefs.TM1CreateObject): Promise<any>
{
	var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject(undefined, tm1NetDefs.TM1APIMethod.POST);

	req.apiCall = type;

	return req.execute(dataObj).then(() => {
		tm1Notify.notifySuccess(dataObj.Name + " created successfully!");
	}).catch(error => {
		console.log(error);
	});
}

function getFilePath(fileString: string): string
{
	var localWorkspace: string = path.resolve(tm1CoreDefs.GlobalVars.g_Config.localWorkspace!);
	return path.join(localWorkspace, fileString);
}

/*
* runTM1Process: Runs a given TI process with user provided parameter values
*/
export async function runTM1Process(fileString: string)
{
	var fileName: tm1CoreDefs.TM1File = new tm1CoreDefs.TM1File(fileString);
	var params: tm1NetDefs.TM1RunProcessParameter[] = await getTM1Params(fileString);
	console.log(params);

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

		var dataObj = {
			"Parameters": params
		};
		var data = JSON.stringify(dataObj);
		console.log(data);
	
		return req.execute(data).then((response) => {
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
* getTM1Params: Gets the user input for parameters for a given TI process; needs to return in Name:Value format
*/
async function getTM1Params(fileString: string): Promise<tm1NetDefs.TM1RunProcessParameter[]>
{
	var data: tm1NetDefs.TM1RunProcessParameter[] = [];

	var response = await getTM1Object(fileString, tm1NetDefs.TM1APICalls.getParams, "Parameters");
	console.log(response);
	for (var i = 0; i < response.length; i++) {
		var element: tm1NetDefs.TM1ProcessParameter = response[i];
		console.log(element.Name);
		if (typeof(element.Value) == "number") {
			element.Value = element.Value.toString();
		}
		var param = await tm1Notify.notifyParamInput(element);
		if (param) {
			data.push(
				{
					Name: element.Name,
					Value: param
				}
			);
		}
	}

	return new Promise((resolve, reject) => {resolve(data)});
}

/*
* refreshTreeView: Refreshes a given ObjectProviders data
*/
export function refreshViews()
{
	tm1CoreDefs.GlobalVars.g_isLoadLocalWorkspace = true;
	init.initExt();
}

export async function createTM1Process()
{
	var procName = await tm1Notify.notifyNewProcInput();
	if (!procName) {
		return;
	}

	var procTemplatePath = vscode.Uri.joinPath(tm1CoreDefs.GlobalVars.g_extensionContextUri, 'resources', 'proc_template.json');
	getFileData(procTemplatePath.fsPath).then(response => {
		var dataObj = JSON.parse(response);
		dataObj.Name = procName;
		createTM1Object(dataObj, tm1NetDefs.TM1CreateObject.process).then(() => {
			refreshViews();
		});
	});
}

export function deleteTM1Object(fileString: string)
{
	var fileName: tm1CoreDefs.TM1File = new tm1CoreDefs.TM1File(fileString);
        var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject(undefined, tm1NetDefs.TM1APIMethod.DELETE);
	var file = getFilePath(fileString);

	fs.unlinkSync(file);

	req.apiCall = fileName.apiPrefix + "('" + fileName.name + "')";
	req.execute().then(() => {
		refreshViews();
		tm1Notify.notifySuccess(fileName.name + " " + fileName.type + " deleted successfully!");
	}).catch(error => {
		console.log(error);
	});
}