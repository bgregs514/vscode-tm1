import * as vscode from 'vscode';
import * as tm1NetDefs from "../net/netDefs";
import * as tm1CoreDefs from "../core/classDefs";

export function initTM1Config()
{
        var settings = vscode.workspace.getConfiguration("vscode-tm1");
        var config: tm1NetDefs.TM1Config = tm1CoreDefs.GlobalVars.g_Config;

        config.localWorkspace = settings.get("localWorkspace");
        config.disableStartupPage = settings.get("disableStartupPage");
        config.username = settings.get("defaultConnection.Username");
        config.password = settings.get("defaultConnection.Password");
        config.CAMNamespace = settings.get("defaultConnection.CAMNamespace");
        config.hostname = settings.get("defaultConnection.Hostname");
        config.httpPortNumber = settings.get("defaultConnection.HTTPPortNumber");
        config.integratedSecurityMode = settings.get("defaultConnection.IntegratedSecurityMode");
        switch (config.integratedSecurityMode)	
        {
                case '2':
                case '1':
                        config.encodedCreds = "Basic " + Buffer.from(config.username+ ":" + config.password).toString("base64");
                        break;
                case '4':
                case '5':
                        config.encodedCreds = "CAMNamespace " + Buffer.from(config.username + ":" + config.password + ":" + config.CAMNamespace).toString("base64");
                        break;
                default:
                        config.encodedCreds = "Negotiate " + Buffer.from(config.username + ":" + config.password + ":" + config.CAMNamespace).toString("base64");
        }
        tm1CoreDefs.GlobalVars.g_Config.baseURL = "https://" + config.hostname + ":" + config.httpPortNumber + "/api/v1/";
}