
import {commands,workspace, window} from 'vscode';
import {TM1ObjectProvider, GlobalVars} from "./core/classDefs";
import {tm1Req} from "./net/netDefs";
/*
export class connectionManager
{
/* we want to be able to 
    - add 
    - remove
    - list
connections based on the settings users define */
//constructor(){
//};
/*
    Try opening configuration settings
*/

export function  openConnectionSettings()
{
    console.log("Opening the Add Connection Screen");
    commands.executeCommand('workbench.action.openSettings', `vscode-tm1.defaultConnection`);
    //commands.executeCommand('workbench.action.openSettings', `vscode-tm1.connectionList`);
};

interface tm1ServerConnection {
    connectionName: string;
    connectionHostName: string;
}

export function listConnections()
{
    console.log("List tm1 connections");
    var settings = workspace.getConfiguration("vscode-tm1");
    var connectionList:[tm1ServerConnection];
    settings.get("connectionList",[""]).forEach(connection => {
        console.log("Adding connection " + connection[<any> "vscode-tm1.connectionName"]);  
    });      
};