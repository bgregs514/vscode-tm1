import * as vscode from 'vscode';
import {tm1RestCall} from "./netDefs";

/*
* GlobalVars: Class export allows for treating members as variables instead of aliases, which
* will trigger a compile time warning
*
* Consists of the following global variables:
*	g_OpenDocuments: Used to dynamically track which files are open at any given time
*/
export class GlobalVars {
	public static g_OpenDocuments:any[];
}

/*
* TM1Return: Supports the return types for TM1 rules and TIs
*/
export interface TM1Return {
	value?: Array<any>,
	Rules?: string
        PrologProcedure?: string,
}

/*
* TM1ObjectProvider: The main class that provides the data for the tree views (Cube and Process lists)
*/
export class TM1ObjectProvider implements vscode.TreeDataProvider<TM1Return> {
	/* Hook up the refresh event to the TreeDataProvider */
	private _onDidChangeTreeData: vscode.EventEmitter<TM1Return | null> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<TM1Return | null> = this._onDidChangeTreeData.event;
	
	private apiCall;
	constructor(apiCall: string) {
		//console.log(data);
		this.apiCall = apiCall;
	}

	/* TODO: Fire accepts an additional parameter to refresh children of the tree view, this
	would be better for cases where we don't want to refresh the whole tree */
	refresh() {
		this._onDidChangeTreeData.fire(null);
	}

	getTreeItem(item: any): TM1TreeItem {
		return new TM1TreeItem(
			item.Name
		);
	}

	/* getChildren: Called on creation and refresh functions; passes return to getTreeItem where
	the actual tree item element is created */
	getChildren(element?: any): Thenable<[]> {
		if (element) {
			return Promise.resolve(element.children);
		} else {
			return Promise.resolve(tm1RestCall(this.apiCall, "GET").then(response => {
				var data: any = response.value!;
				return data;
			}));
		}
	}
}

/*
* TM1TreeItem: Custom TreeItem class to define contextValue and other attributes
*/
export class TM1TreeItem extends vscode.TreeItem{
	constructor(label: string) {
		super(label);
		console.log("created");
	}

	contextValue = GlobalVars.g_OpenDocuments.includes(this.label) ? "open" : "closed";
}