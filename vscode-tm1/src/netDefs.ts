import * as vscode from 'vscode';
import axios, {Method} from 'axios';
import * as https from 'https';
import {TM1Return} from "./classDefs";

/*
* tm1RestCall: The main function for "GET"ing and "PATCH"ing TM1 data to the database instance
*/
export async function tm1RestCall(apiCall: string, apiType: Method): Promise<TM1Return>
{
	var settings = vscode.workspace.getConfiguration("vscode-tm1");
	var encodedCreds = "";
	// can try getting the integrated mode somehow better in future
	switch ( settings.get("integrated_security_mode"))	
	{
		case 1:
			encodedCreds = "Basic " + Buffer.from(settings.get("username") + ":" + settings.get("password")).toString("base64");
			break;
		case 5:
			encodedCreds = "CAMNamespace " + Buffer.from(settings.get("username") + ":" + settings.get("password") + ":" + settings.get("namespace")).toString("base64");
			break;
		default:
			encodedCreds = "Negotiate " + Buffer.from(settings.get("username") + ":" + settings.get("password") + ":" + settings.get("namespace")).toString("base64");
	}
	var baseURL = "https://" + settings.get("hostname") + ":" + settings.get("port") + "/api/v1/";
	
	const config =  {
		httpsAgent: new https.Agent({
			rejectUnauthorized: false,
		}),
		headers: {
			"Content-Type": "application/json",
			"Authorization": encodedCreds
		},
		method: apiType,
		url: encodeURI(baseURL + apiCall)
	};
	
	return axios(config).then(response => {
		//console.log(response.data);
		return response.data;
	}).catch(error => {
		console.log(error);
	});
}
