import axios, {Method} from 'axios';
import * as https from 'https';
import * as tm1CoreDefs from "../core/classDefs";

/*
* TM1APIMethod: An "easier to consume" way of passing axios Method parameters - used to avoid
* passing raw strings
*/
export enum TM1APIMethod {
	GET = "GET",
	PATCH = "PATCH",
	POST = "POST"
}

/*
* TM1Return: Supports the return types for TM1 rules and TIs
*/
export interface TM1Return {
	value?: Array<any>,
	Rules?: string,
	Code?: string,
	PrologProcedure?: string,
	ProcessExecuteStatusCode?: string
}

export interface TM1Config {
	localWorkspace: string | undefined,
	disableStartupPage: boolean | undefined,
	encodedCreds: string | undefined,
	username: string | undefined,
	password: string | undefined,
	CAMNamespace: string | undefined,
	hostname: string | undefined,
	httpPortNumber: string | undefined,
	integratedSecurityMode: string | undefined
	baseURL: string | undefined
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
	constructor(apiCall?: string | undefined, method?: TM1APIMethod | undefined)
	{
		if (apiCall)
			this.apiCall = apiCall;
		if (method)
			this.method = method;
	}

	/*
	* execute: The main function for "GET"ing and "PATCH"ing TM1 data to the database instance
	*/
	public async execute(dataObj?: any): Promise<TM1Return>
	{
		var config: TM1Config = tm1CoreDefs.GlobalVars.g_Config;
		
		const axiosConfig =  {
			httpsAgent: new https.Agent({
				rejectUnauthorized: false,
			}),
			headers: {
				"Content-Type": "application/json",
				"Authorization": config.encodedCreds
			},
			method: this.method,
			url: encodeURI(config.baseURL + this.apiCall),
			data: dataObj ? dataObj : null
		};
		
		return axios(axiosConfig).then(response => {
			//console.log(response.data);
			return response.data;
		}).catch(error => {
			console.log(error);
		});
	}
}