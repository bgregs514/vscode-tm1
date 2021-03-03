import * as vscode from 'vscode';
import * as tm1Core from "../core/classDefs";
import {tm1Req} from "../net/netDefs";

/*
* updateOpenDocuments: Adjust g_OpenDocuments to account for changes, and refresh the TM1ObjectProvider
* to display the "Save" icon
*/
export function updateOpenDocuments(selectionName: string, objectProvider: tm1Core.TM1ObjectProvider)
{
	tm1Core.GlobalVars.g_OpenDocuments.push(selectionName);
	objectProvider.refresh();
}

/*
* createNewDocument: On TreeView selection change, create a new tab for the TM1 object and display it
* with the appropriate language file
*/
export function createNewDocument(type: string, tm1Content: string)
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
export function setEditorText(type: string, queryObj?: string)
{
	var req: tm1Req.TM1ReqObject = new tm1Req.TM1ReqObject();

	if (type == "rule") {
		req.apiCall = "Cubes('" + queryObj + "')?$select=Rules";
	} else {
		req.apiCall = "Processes('" + queryObj + "')?$select=Code";
	}

	req.execute().then(response => {
		var content;
		if (type == "rule") {
			content = response.Rules!;
		} else {
			content = response.Code!;
		}
		
		createNewDocument(type, content);
	});
}