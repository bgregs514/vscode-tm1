import * as vscode from 'vscode';
import * as tm1NetDefs from "../net/netDefs";

export function notifySuccess(message: string)
{
        vscode.window.showInformationMessage(message);
}

export function notifyError(message: string)
{
        vscode.window.showErrorMessage(message);
}

export function notifyParamInput(param: tm1NetDefs.TM1ProcessParameter): Thenable<string | undefined>
{
        var tempValue: string = param.Value.toString();

        var options: vscode.InputBoxOptions = {
                prompt: param.Name + ": " + param.Prompt + ": " + param.Type,
                value: tempValue,
                validateInput: (value: string): string | undefined => {
                        if (param.Type == "Numeric" && isNaN(parseFloat(value))) {
                                return "Parameter value must be of type " + param.Type
                        } else {
                                return undefined;
                        }
                }
                
        };

        return vscode.window.showInputBox(options);
}

export function notifyNewProcInput(): Thenable<string | undefined>
{
        var options: vscode.InputBoxOptions = {
                prompt: "Input New Process Name",
                value: "",
                placeHolder: "New TI Process"
        }

        return vscode.window.showInputBox(options);
}