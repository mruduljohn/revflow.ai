import * as vscode from 'vscode';
import fetch from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "revflow-ai" is now active!');

    // Register the 'enterapikey' command
    let disposable = vscode.commands.registerCommand('enterapikey', () => {
        // Ask the user to enter their ChatGPT API key
        vscode.window.showInputBox({
            prompt: 'Enter your ChatGPT API key:',
            password: true, // This hides the entered text
        }).then(apiKey => {
            if (apiKey) {
                // Save the API key to the VS Code configuration
                vscode.workspace.getConfiguration().update('revflowAI.apiKey', apiKey, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('ChatGPT API key is set.');

                // Prompt the user for a project description
                vscode.window.showInputBox({
                    prompt: 'What are you going to build?',
                }).then(projectDescription => {
                    if (projectDescription) {
                        // Send the project description to your API and display the response
                        sendProjectDescription(apiKey, projectDescription);
                    } else {
                        vscode.window.showWarningMessage('No project description entered. The extension may not work correctly.');
                    }
                });
            } else {
                vscode.window.showWarningMessage('No API key entered. The extension may not work correctly.');
            }
        });
    });

    // Subscribe the command to the context
    context.subscriptions.push(disposable);

    // Register the 'hello' command
    disposable = vscode.commands.registerCommand('hello', () => {
        // Retrieve the saved API key from the VS Code configuration
        const apiKey = vscode.workspace.getConfiguration().get('revflowAI.apiKey');

        vscode.window.showInformationMessage(`Hello World from revflow.ai! - Jishnu\nYour ChatGPT API key is: ${apiKey}`);
    });

    // Subscribe the command to the context
    context.subscriptions.push(disposable);
}

function sendProjectDescription(apiKey: string, projectDescription: string) {
    // Replace 'YOUR_API_ENDPOINT' with the actual endpoint of your API
    const apiEndpoint = 'YOUR_API_ENDPOINT';

    // Make an HTTP request to your API with the project description
    fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            projectDescription,
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Display the response from your API
        vscode.window.showInformationMessage(`API Response: ${data.answer}`);
    })
    .catch(error => {
        vscode.window.showErrorMessage(`Failed to send project description to the API: ${error.message}`);
    });
}

export function deactivate() {}
