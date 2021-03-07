import * as vscode from 'vscode';
import {tm1Req} from "../net/netDefs";

/*
* GlobalVars: Class export allows for treating members as variables instead of aliases, which
* will trigger a compile time warning
*
* Consists of the following global variables:
*	g_OpenDocuments: Used to dynamically track which files are open at any given time
*/
export class GlobalVars {
	public static g_OpenDocuments:DocumentObject[];
}

/*
* DocumentObject: Used to describe the properties of g_OpenDocuments
* TODO: Add an attribute to flag when text has changed; this can then be used to determine if the save icon should be
*	displayed
*/
export interface DocumentObject {
	name: string,
	type: string,
	docHandle: vscode.TextDocument
}

/*
* TM1ViewHelper: Helper class to easily access treeView and dataProvider handles
*/
export class TM1ViewHelper {
	public readonly treeView: vscode.TreeView<any>;
	public readonly dataProvider: TM1ObjectProvider;
	
	constructor(viewName: string, tm1ReqObject: tm1Req.TM1ReqObject)
	{
		this.dataProvider = new TM1ObjectProvider(tm1ReqObject);
		this.treeView = vscode.window.createTreeView(viewName, {
			canSelectMany: false,
			showCollapseAll: true,
			treeDataProvider: this.dataProvider
		});
	}
}

/*
* TM1ViewConfig: Defines the properties that a vscode-tm1 view should have
*/
export interface TM1ViewConfig {
	viewName: string,
	language: string
}

/*
* TM1ObjectProvider: The main class that provides the data for the tree views (Cube and Process lists)
*/
export class TM1ObjectProvider implements vscode.TreeDataProvider<tm1Req.TM1Return> {
	/* Hook up the refresh event to the TreeDataProvider */
	private _onDidChangeTreeData: vscode.EventEmitter<tm1Req.TM1Return | null> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<tm1Req.TM1Return | null> = this._onDidChangeTreeData.event;
	
	private tm1ReqObject;
	constructor(tm1ReqObject: tm1Req.TM1ReqObject) {
		//console.log(data);
		this.tm1ReqObject = tm1ReqObject;
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
			return Promise.resolve(this.tm1ReqObject.execute().then(response => {
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
	}

	contextValue = this.getOpenDocs();

	getOpenDocs(): string
	{
		var status = "closed";
		var docs = GlobalVars.g_OpenDocuments;

		for (var i = 0; i < docs.length; i++) {
			if (docs[i].name == this.label) {
				status = "open";
				break;
			}
		}

		return status;
	}
}