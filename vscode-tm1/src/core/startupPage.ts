import * as vscode from 'vscode';

export function getStartupHTML(webview: vscode.Webview, extensionUri: vscode.Uri)
{
        const fontAwesomeUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "node_modules", "@fortawesome", "fontawesome-free", "css", "all.css"));
        const plexFont = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "node_modules", "@ibm", "plex", "css", "ibm-plex.css"));

        const tiEditGif = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "gifs", "tiEdit.gif"));
        const tiRunGif = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "gifs", "tiRun.gif"));
        const tiCreateGif = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "gifs", "tiCreate.gif"));
        const tiDeleteGif = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "gifs", "tiDelete.gif"));

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>vscode-tm1 Startup</title>
            <link href="${fontAwesomeUri}" rel="stylesheet" />
            <link href="${plexFont}" rel="stylesheet" />
        </head>
        <body style="font-family:'IBM Plex Mono';">
            <div style="width:50%;margin-left:auto;margin-right:auto;">
            <h1>vscode-tm1: A TM1 extension for Visual Studio Code</h1>
            <hr>
            <span style="font-size:14px;">Note: To stop this page from showing on startup, check the "Disable Startup Page" box in the settings menu.</span>
            
            <h2>Current Feature List:</h2>
                <span style="font-size:14px;">Improved rule/TI editing with syntax highlighting, Intellisense, and useful code snippets</span>
                <img style="padding-top:10px;" src="${tiEditGif}"/>
                <br><br>
                <span style="font-size:14px;">Run TIs with parameters</span>
                <img style="padding-top:10px;" src="${tiRunGif}"/>
                <br><br>
                <span style="font-size:14px;">Create new TM1 objects</span>
                <img style="padding-top:10px;" src="${tiCreateGif}"/>
                <br><br>
                <span style="font-size:14px;">Delete TM1 objects</span>
                <img style="padding-top:10px;" src="${tiDeleteGif}"/>
            <h2>Upcoming Feature List:</h2>
                        <li>Cancel threads</li>
                        <li>Inline MDX support</li>
                        <li>Cube viewer (through PAW api)</li>
                        <li>Drag and drop object support</li>
                        <li>TM1 git integration (native git integration is supported through other VSCode extensions)</li>
            <h2><i class="fas fa-heart" style="color:#fc031c;"></i>
                 Special Thanks:
            </h2>
                        <li>Yuri</li>
                        <li>Christoph</li>
                        <li>Edward</li>
                        <li>Those that contributed ideas, feedback, moral support, and free beer 
                        <i class="fas fa-beer" style="color:#f5b942;"></i></li>
                <footer>
                        <p>Proudly made in Austin, TX 
                                <i class="fas fa-hat-cowboy" style="color:#db7c1d;"></i>
                        </p>
                </footer>
            </div>
        </body>
        </html>`
}