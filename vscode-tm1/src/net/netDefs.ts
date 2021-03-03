import * as vscode from 'vscode';
import axios, {Method} from 'axios';
import * as https from 'https';

/*
* tm1Req: Namespace for all http request related functions, types, etc.
*/
export namespace tm1Req {
	/*
	* TM1APIMethod: An "easier to consume" way of passing axios Method parameters - used to avoid
	* passing raw strings
	*/
	export enum TM1APIMethod {
		GET = "GET",
		PATCH = "PATCH"
	}

	/*
	* TM1Return: Supports the return types for TM1 rules and TIs
	*/
	export interface TM1Return {
		value?: Array<any>,
		Rules?: string,
		Code?: string,
		PrologProcedure?: string
	}

	/*
	* TM1ReqObject: Used by tm1RestCall, contains all API specific configs such as query string and
	* method type (GET, PATCH, etc.)
	* Defaults: method = GET
	* Methods: execute(): Run the http request with the defined member configurations
	*/
	export class TM1ReqObject {
		public apiCall: string = "";
		public method: TM1APIMethod = TM1APIMethod.GET;

		/* Optional constructor to assign apiCall and method type */
		constructor(apiCall?: string, method?: TM1APIMethod)
		{
			if (apiCall)
				this.apiCall = apiCall;
			if (method)
				this.method = method;
		}

		/*
		* tm1RestCall: The main function for "GET"ing and "PATCH"ing TM1 data to the database instance
		*/
		public async execute(): Promise<TM1Return>
		{
			var settings = vscode.workspace.getConfiguration("vscode-tm1");
			var encodedCreds = "";
			// can try getting the integrated mode somehow better in future
			switch (settings.get("integrated_security_mode"))	
			{
				case 2:
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
				method: this.method,
				url: encodeURI(baseURL + this.apiCall)
			};
			
			return axios(config).then(response => {
				//console.log(response.data);
				return response.data;
			}).catch(error => {
				console.log(error);
			});
		}
	}
}