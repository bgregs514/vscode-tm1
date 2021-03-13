import * as vscode from 'vscode';
import * as tm1Core from "../core/classDefs";
import * as tm1CoreDefs from "../core/classDefs";
import * as tm1NetDefs from "../net/netDefs";

/*
* updateOpenDocuments: Adjust g_OpenDocuments to account for changes, and refresh the TM1ObjectProvider
* to display the "Save" icon
*/
export function updateOpenDocuments(type: string, selectionName: string)
{
	if (getDocument(selectionName)) {
	 	return;
	}

	var docObj: tm1CoreDefs.DocumentObject = {
		name: selectionName,
		type: type,
		docHandle: getActiveDocument()
	}

	tm1Core.GlobalVars.g_OpenDocuments.push(docObj);
	console.log(tm1Core.GlobalVars.g_OpenDocuments);
}

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
export function sendTM1Object(type: string, queryObj: string, data: string)
{	
        var req: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject(undefined, tm1NetDefs.TM1APIMethod.PATCH);
	var dataObj = {};
	
        if (type == "rule") {
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
        req.execute(dataObj).catch(error => {
                console.log(error);
        });
}

/*
* getDocument: Returns a requested document from g_OpenDocuments
*/
export function getDocument(docName: string): tm1CoreDefs.DocumentObject | null
{
	var docs: tm1CoreDefs.DocumentObject[] = tm1Core.GlobalVars.g_OpenDocuments;
	var docRecord = <tm1CoreDefs.DocumentObject>{};

	for (var i = 0; i < docs.length; i++) {
		if (docs[i].name == docName) {
			docRecord = docs[i];
			break;
		}
	}

	return docRecord.name ? docRecord : null;
}

/*
* getActiveDocument: Returns a TextDocument handle from the active editor
*/
function getActiveDocument(): vscode.TextDocument
{
	var editor = vscode.window.activeTextEditor;

	if (!editor) {
		console.log("not ready yet");
	}
	return vscode.window.activeTextEditor?.document!;
}

/*
* refreshTreeView: Refreshes a given ObjectProviders data
*/
export function refreshTreeView(objectProvider: tm1Core.TM1ObjectProvider)
{
	objectProvider.refresh();
}