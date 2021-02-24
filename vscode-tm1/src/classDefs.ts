import * as vscode from 'vscode';

export interface TM1Return {
	value?: Array<any>,
	Rules?: string
        PrologProcedure?: string,
}

export class TM1ObjectProvider implements vscode.TreeDataProvider<any> {
	constructor(private data:any) {
		//console.log(data);
	}

	getTreeItem(item: any): TM1TreeItem {
		return new TM1TreeItem(
			item.Name
			// item.children.length > 0
			// 	? vscode.TreeItemCollapsibleState.Collapsed
			// 	: vscode.TreeItemCollapsibleState.None
		);
	}

	getChildren(element?: any): Thenable<[]> {
		if (element)
			return Promise.resolve(element.children);
		else
			return Promise.resolve(this.data);
	}
}

/* Custom TreeItem class to add a command for each item created */
export class TM1TreeItem extends vscode.TreeItem{
	// command = {
	// 	"title": "Pull Data",
	// 	"command": "tm1code.view.pullData"
	// }
	constructor(label: string) {
		super(label);
	}
}