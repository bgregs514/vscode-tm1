import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as tm1Core from "../core/core"
import * as tm1CoreDefs from "../core/classDefs";
import * as tm1NetDefs from "../net/netDefs";
import * as tm1Net from "../net/net";
import * as connectionManager from "./../connectionManager";
import * as startupPage from "../core/startupPage"
import * as tm1Notify from "../core/notify";

const _onDidChangeFileDecorations: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();

export function initExt()
{
	initLocalWorkspace();
	loadObjectLists().then(() => {
		populateTreeViews();
	});
}

function refreshDecorator(uri: vscode.Uri)
{
	_onDidChangeFileDecorations.fire(uri);
}

function isChangeSource(uri: vscode.Uri): Promise<boolean>
{
	var fileString = path.parse(uri.fsPath).base;
	return new Promise<boolean>((resolve, reject) => {
		if (!path.parse(fileString).ext) {
			reject(false);
			return false;
		}
		tm1Core.getTM1Object(fileString).then((response) => {
			tm1Core.getFileData(uri.fsPath).then((fileData) => {
				if (fileData != response) {
					resolve(true);
				} else {
					resolve(false);
				}
			}).catch(() => {
				reject(false);
			});
		});
	});
}

/*
* initVars: Initialize global variables and other misc. things that don't belong in registerCommands
*/
export async function initVars(context: vscode.ExtensionContext)
{
        /* g_Config */
        tm1CoreDefs.GlobalVars.g_Config = <tm1NetDefs.TM1Config>{};
       await tm1Net.initTM1Config(context);

	/* File Decorators */
	var resProv: vscode.FileDecorationProvider = {
		provideFileDecoration: (uri: vscode.Uri, token: vscode.CancellationToken): Promise<vscode.FileDecoration | undefined> => {
			//console.log(path.parse(uri.fsPath).base);
			return isChangeSource(uri).then(isChanged => {
				if (isChanged) {
					//console.log("changed");
					return {
						badge: 'M',
						color: new vscode.ThemeColor("gitDecoration.modifiedResourceForeground"),
						tooltip: "User count"
					};
				}
				return undefined;
			});
		},
		onDidChangeFileDecorations: _onDidChangeFileDecorations.event
	}
	vscode.window.registerFileDecorationProvider(resProv);
	/* Fire the decorator refresh check every time the document will be saved */
	vscode.workspace.onWillSaveTextDocument(event => {
		if (event.document.fileName) {
			refreshDecorator(vscode.Uri.file(event.document.fileName));
		}
	});
}

/*
* openStartupPage: Open the startup page; can be disabled in the settings
*/
export function openStartupPage()
{
	var config: tm1NetDefs.TM1Config = tm1CoreDefs.GlobalVars.g_Config;
	var disableStartupPage = config.disableStartupPage;
	var extensionUri = tm1CoreDefs.GlobalVars.g_extensionContextUri;

	if (disableStartupPage) {
		return;
	}

	const startupPanel = vscode.window.createWebviewPanel("startup", "vscode-tm1 Startup",
								vscode.ViewColumn.Active,
								{});
	startupPanel.webview.html = startupPage.getStartupHTML(startupPanel.webview, extensionUri);
}

/*
* registerCommands: Register commands that the user (or another extension) may want to call directly
*/
export function registerCommands()
{
	vscode.commands.getCommands().then((commands) => {
		/* Settings refresh command */
		vscode.commands.registerCommand("vscode-tm1.refreshSettings", () => {initExt();});

		/* Tree view commands */
		vscode.commands.registerCommand("vscode-tm1.saveObject", async (viewItem) => {
			if (!viewItem) {
				var editor = vscode.window.activeTextEditor;
				if (editor) {
					await editor.document.save();
					viewItem = path.parse(editor.document.fileName).base;
				}
			}
			if (viewItem) {
				tm1Core.sendTM1Object(viewItem);
			} else {
				tm1Notify.notifyError("No file opened");
			}
		});

		vscode.commands.registerCommand("vscode-tm1.deleteObject", (viewItem) => {
			tm1Core.deleteTM1Object(viewItem);
		});

		/* Process commands */
		vscode.commands.registerCommand("vscode-tm1.runProcess", (viewItem) => {
			//console.log(viewItem);
			/* Handle a run from the editor/title/run menu */
			if (typeof viewItem != "string") {
				viewItem = path.parse(viewItem["path"]).base;
			}
			tm1Core.runTM1Process(viewItem);
		});

		vscode.commands.registerCommand("vscode-tm1.modifyProcess", (viewItem) => {
			var metaFile = path.parse(viewItem).name + tm1CoreDefs.TM1MetaExt.pro;
			tm1Core.openNewDocument(metaFile);
		});

		vscode.commands.registerCommand("vscode-tm1.createProcess", () => {
			tm1Core.createTM1Process();
		})

		/* Connection Manager commands */
		vscode.commands.registerCommand("vscode-tm1.openAddConnectionScreen", () => {connectionManager.openConnectionSettings()});

		vscode.commands.registerCommand("vscode-tm1.refreshConnectionView", () => {connectionManager.listConnections()});
	});
}

/*
* initLocalWorkspace: Checks that a local workspace exists and creates it if it doesn't; will also set the
* global flag to load the workspace if the directory exists, but is empty
*/
function initLocalWorkspace()
{
	var config: tm1NetDefs.TM1Config = tm1CoreDefs.GlobalVars.g_Config;
	var localWorkspace = config.localWorkspace;

	/* Assign user directory default if not Local Workspace specified */
	if (localWorkspace == "") {
		localWorkspace = path.join(os.homedir(), '.vscode-tm1');
		tm1CoreDefs.GlobalVars.g_Config.localWorkspace = localWorkspace;
	}
	console.log("Local Workspace: " + localWorkspace);

	/* Create local workspace if it doesn't exist */
	if (!isLocalWorkspaceExists(localWorkspace!)) {
		fs.mkdirSync(localWorkspace!);
	}

	/* Load the local workspace from TM1 if it is empty */
	if (isLocalWorkspaceEmpty(localWorkspace!)) {
		tm1CoreDefs.GlobalVars.g_isLoadLocalWorkspace = true;
	}
}

function isLocalWorkspaceExists(localWorkspace: string): boolean
{
	return fs.existsSync(localWorkspace!);
}

function isLocalWorkspaceEmpty(localWorkspace: string): boolean
{
	return fs.readdirSync(localWorkspace!).length === 0;
}

/*
* loadObjectLists: Creates the api calls for rule and process objects and passes the configuration to
* createLocalWorkspaceFiles; this will only trigger if the local workspace is empty
*/
async function loadObjectLists(): Promise<any>
{
	var isLoadLocalWorkspace: boolean = tm1CoreDefs.GlobalVars.g_isLoadLocalWorkspace;

	if (!isLoadLocalWorkspace) {
		return;
	}

	console.log("Saving Local Workspace");

	var apiConfigs: tm1NetDefs.TM1ReqObject[] = [];
	var typeConfigs: string[] = [];
	
	/* Rule Objects */
	var cubApiConfig: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject();
	cubApiConfig.apiCall = "Cubes?$select=Name";
	apiConfigs.push(cubApiConfig);
	typeConfigs.push("rule");

	/* Process Objects */
	var procApiConfig: tm1NetDefs.TM1ReqObject = new tm1NetDefs.TM1ReqObject();
	procApiConfig.apiCall = "Processes?$select=Name";
	apiConfigs.push(procApiConfig);
	typeConfigs.push("process");

	/* Create local workspace files */
	for (var i = 0; i < apiConfigs.length; i++) {
		await createLocalWorkspaceFiles(typeConfigs[i], apiConfigs[i]);
	}

	/* Disable future local workspace loading
		TODO: This might not be necessary, and if not, we should remove this and the g_isLoadLocalWorkspace
		variable
	*/
	tm1CoreDefs.GlobalVars.g_isLoadLocalWorkspace = false;
	
	return new Promise<any>((resolve, reject) => {resolve(true)});
}

/*
* createLocalWorkspaceFiles: Creates the workspace files with the proper extension;
* Yes, this is messy; I have tried to simplify it, but the levels of nesting with async calls took a long
* time to get right; change this at your own risk
*/
function createLocalWorkspaceFiles(type: string, tm1ReqObject: tm1NetDefs.TM1ReqObject): Promise<any>
{
	return new Promise<any>((resolve, reject) => {
		console.log("doing stuff");
		return tm1ReqObject.execute().then((response) => {
			//console.log(response);
			return response.value?.forEach((element: any, i: number) => {
				var config: tm1NetDefs.TM1Config = tm1CoreDefs.GlobalVars.g_Config;
				var localWorkspace = config.localWorkspace;
				
				var extension = getFileExtension(type, element.Name);
				var fileString = element.Name + extension;
				var filePath = path.join(localWorkspace!, fileString);
				
				return tm1Core.getTM1Object(fileString).then((content) => {
					if (!fs.existsSync(filePath)) {
						console.log("doesn't exist " + filePath);
						return fs.writeFile(filePath, content, (error) => {
							if (error) {
								console.log(error.message);
								reject(error.message);
							}
							console.log("writing");
							if (type == "process") {
								tm1Core.getTM1Object(fileString, tm1NetDefs.TM1APICalls.getProcMetaData, "").then((response) => {
									var metaFileString = element.Name + tm1CoreDefs.TM1MetaExt.pro;
									var metaFilePath = path.join(localWorkspace!, metaFileString);
									fs.writeFile(metaFilePath, JSON.stringify(response), (error) => {
										if (error) {
											console.log(error);
										}
									});
								});
							}
							if (i === (response.value?.length! - 1)) {
								resolve(content);
							}
						});
					} else {
						console.log("already exists " + filePath);
						return resolve(true);
					}
				});
			});
		});
	});
}

function getFileExtension(type: string, fileName: string): string
{
	var fileExt = "";
	var controlChar = fileName[0];
		
		if (type == "rule") {
			fileExt = controlChar != '}' ? ".rul" : ".rulx";
		} else {
			fileExt = controlChar != '}' ? ".pro" : ".prox";
		}

		return fileExt;
}

/*
* populateTreeView: Populates the TreeViews with references to the local workspace files; this should only
* be called after we are sure all files are done saving (if the files are being initialized)
*/
function populateTreeViews()
{
	var treeViews: {viewName: string, fileExt: string}[] = [
		{viewName: "cubList", fileExt: ".rul"},
		{viewName: "procList", fileExt: ".pro"},
		{viewName: "rulxList", fileExt: ".rulx"},
		{viewName: "proxList", fileExt: ".prox"}
	];
	console.log("starting");

	treeViews.forEach(element => {
		var view = new tm1CoreDefs.TreeViewHelper(element.viewName, element.fileExt);

			view.treeView.onDidChangeSelection(() => {
				var selection = view.treeView.selection;
				tm1Core.openNewDocument(String(selection));
				view.dataProvider.refresh();
			});
	});
}