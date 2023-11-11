import * as vscode from 'vscode';
import { exec } from 'child_process';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.configureAndSetupProject', async () => {
        // Check if API key is already stored in global state
        let openaiApiKey = context.globalState.get<string>('openaiApiKey');

        if (!openaiApiKey) {
            // If not stored, prompt the user to enter the API key
            openaiApiKey = await vscode.window.showInputBox({
                prompt: 'Enter your OpenAI API key:',
                password: true,
            });

            if (!openaiApiKey) {
                // If the user cancels or doesn't provide a key, exit
                vscode.window.showWarningMessage('No OpenAI API key entered. Project setup canceled.');
                return;
            }

            // Save the API key to global state for future use
            context.globalState.update('openaiApiKey', openaiApiKey);
        }

        // Continue with the project setup
        const userPrompt = await vscode.window.showInputBox({
            prompt: 'Describe your project:'
        });

        if (userPrompt) {
            const customPrompt = `The following is the user prompt. You should give the complete code a noob needs to execute line by line:  "${userPrompt}"`;
            try {
                const response = await generateSetupCommands(openaiApiKey, customPrompt);

                // Save the response to global state
                context.globalState.update('apiResponse', response);

                // Display the response in a new webview panel
                displayApiResponse(response);
                
                vscode.window.showInformationMessage('Project setup complete!');
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to set up the project: ${error.message}`);
            }
        } else {
            vscode.window.showWarningMessage('No project description entered. Project setup canceled.');
        }
    });

    context.subscriptions.push(disposable);
}

function displayApiResponse(response: string): void {
    // Get or create the output channel
    const outputChannel = vscode.window.createOutputChannel('API Response');

    // Append the response to the output channel
    outputChannel.appendLine(response);

    // Show the output channel
    outputChannel.show(true);
}


function getWebviewContent(response: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Response</title>
        </head>
        <body>
            <pre>${response}</pre>
        </body>
        </html>
    `;
}


export function deactivate() {}

async function generateSetupCommands(apiKey: string, projectDescription: string): Promise<string> {
    const openaiApiEndpoint = 'https://api.openai.com/v1/engines/davinci/completions';
    const prompt = `Understand the user prompt and give ONLY terminal package installation codes. ${projectDescription}`;

    try {
        const response = await axios.post(
            openaiApiEndpoint,
            {
                prompt,
                max_tokens: 400,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        if (!response.data.choices || !Array.isArray(response.data.choices)) {
            throw new Error('Unexpected OpenAI API response format');
        }

        const generatedCommands = response.data.choices.map((choice: any) => choice.text.trim()).join('\n');
        return generatedCommands;
    } catch (error: any) {
        throw new Error(`Failed to generate setup commands from OpenAI API: ${error.message}`);
    }
}
