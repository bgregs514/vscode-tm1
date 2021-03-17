import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as tm1NetDefs from "../net/netDefs";

/*
* GlobalVars: Class export allows for treating members as variables instead of aliases, which
* will trigger a compile time warning
*
* Consists of the following global variables:
*/
export class GlobalVars {
	public static g_Config: tm1NetDefs.TM1Config;
	public static g_isLoadLocalWorkspace: boolean;
}

export enum TM1RuleExt {
	rul = ".rul",
	rulx = ".rulx"
}

export enum TM1ProcExt {
	pro = ".pro",
	prox = ".prox"
}

/*
* TM1File: Helper class that handles breaking a given file name into useful attributes
*/
export class TM1File {
	public readonly fullName: string;
	public readonly name: string;
	public readonly ext: string;
	public readonly type: string;
	public readonly apiPrefix: string;
	public readonly apiPostAttr: string;

	constructor(fileName: string)
	{
		this.fullName = fileName;
		this.name = path.parse(fileName).name;
		this.ext = path.parse(fileName).ext;
		this.type = this.getType();
		this.apiPrefix = this.getAPIPrefix();
		this.apiPostAttr = this.getAPIPostAttr();
	}

	private getType(): string
	{
		return Object.values(TM1RuleExt).some((v) => v === this.ext) ? "rule" : "process";
	}

	private getAPIPrefix(): string
	{
		return this.type == "rule" ? "Cubes" : "Processes";
	}

	private getAPIPostAttr(): string
	{
		return this.type == "rule" ? "Rules" : "Code";
	}
}

/*
* TreeViewHelper: Helper class to easily access treeView and dataProvider handles
*/
export class TreeViewHelper {
	public readonly treeView: vscode.TreeView<any>;
	public readonly dataProvider: TM1ObjectProvider;

	constructor(viewName: string, fileExt: string)
	{
		this.dataProvider = new TM1ObjectProvider(fileExt);
		this.treeView = vscode.window.createTreeView(viewName, {
			canSelectMany: false,
			showCollapseAll: true,
			treeDataProvider: this.dataProvider
		});
	}
}

/*
* TM1ObjectProvider: The main class that provides the data for the tree views (Cube and Process lists)
*/
export class TM1ObjectProvider implements vscode.TreeDataProvider<tm1NetDefs.TM1Return> {
	/* Hook up the refresh event to the TreeDataProvider */
	private _onDidChangeTreeData: vscode.EventEmitter<tm1NetDefs.TM1Return | null> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<tm1NetDefs.TM1Return | null> = this._onDidChangeTreeData.event;
	
	private fileExt;
	constructor(fileExt: string) {
		//console.log(data);
		this.fileExt = fileExt;
	}

	/* TODO: Fire accepts an additional parameter to refresh children of the tree view, this
	would be better for cases where we don't want to refresh the whole tree */
	refresh() {
		this._onDidChangeTreeData.fire(null);
	}

	getTreeItem(item: any): TM1TreeItem {		
		return new TM1TreeItem(
			//this.viewName,
			//item.Name
			path.parse(item).name,
			this.fileExt
		);
	}

	/* getChildren: Called on creation and refresh functions; passes return to getTreeItem where
	the actual tree item element is created */
	getChildren(element?: any): Thenable<[]> {
		if (element) {
			return Promise.resolve(element.children);
		} else {
			var localWorkspace: string = path.resolve(GlobalVars.g_Config.localWorkspace!);
			return new Promise<any>((resolve, reject) => {
				return fs.readdir(localWorkspace, (error, fileNames) =>
					error ? reject(error) : resolve(fileNames.filter(el => path.extname(el).toLowerCase() === this.fileExt)));
			});
		}
	}
}

/*
* TM1TreeItem: Custom TreeItem class to define contextValue and other attributes
*/
export class TM1TreeItem extends vscode.TreeItem {
	constructor(label: string, fileExt: string)
	{
		super(label);
		this.iconPath = path.join(__dirname, '..', '..', 'media', 'dark', this.getIconPath(fileExt));
	}

	collapsibleState = 0;

	getIconPath(fileExt: string): string
	{
		var icon = fileExt.toLowerCase().includes(".rul") ? "extensions.svg" : "code.svg";
		
		return icon;
	}
}