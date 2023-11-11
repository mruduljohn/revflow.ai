import * as vscode from 'vscode';
import { exec } from 'child_process';
import axios from 'axios';

const fetch = require('node-fetch');
// Add this import statement
export function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.configureAndSetupProject', async () => {
        // Ask the user to enter their OpenAI API key
        const openaiApiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key:',
            password: true, // This hides the entered text
        });
        if (openaiApiKey) {
            // Save the OpenAI API key to the VS Code configuration
            vscode.workspace.getConfiguration().update('extension.openaiApiKey', openaiApiKey, vscode.ConfigurationTarget.Global);
            // Prompt the user for a project description
            const projectDescription = await vscode.window.showInputBox({
                prompt: 'Describe your project:'
            });
            if (projectDescription) {
                // Run the setup based on the project description
                try {
                    await setupProject(openaiApiKey, projectDescription);
                    vscode.window.showInformationMessage('Project setup complete!');
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Failed to set up the project: ${error.message}`);
                }
            }
            else {
                vscode.window.showWarningMessage('No project description entered. Project setup canceled.');
            }
        }
        else {
            vscode.window.showWarningMessage('No OpenAI API key entered. Project setup canceled.');
        }
    });
    context.subscriptions.push(disposable);
}
async function setupProject(apiKey, projectDescription) {
    const setupCommands = await generateSetupCommands(apiKey, projectDescription);
    for (const command of setupCommands) {
        await runShellCommand(command);
    }
}
async function generateSetupCommands(apiKey, projectDescription) {
    // Use OpenAI API to generate setup commands based on the project description
    const openaiApiEndpoint = 'https://api.openai.com/v1/engines/davinci/completions';
    const prompt = `Set up a project: "${projectDescription}"`;
    try {
        const response = await fetch(openaiApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                prompt,
                max_tokens: 100, // Adjust as needed
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to generate setup commands from OpenAI API: ${response.status}`);
        }
        const data = await response.json();
        if (!data.choices || !Array.isArray(data.choices)) {
            throw new Error('Unexpected OpenAI API response format');
        }
        const generatedCommands = data.choices.map((choice) => choice.text.trim());
        return generatedCommands;
    }
    catch (error) {
        throw new Error(`Failed to generate setup commands from OpenAI API: ${error.message}`);
    }
}
async function runShellCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(new Error(`Failed to execute command: ${command}. ${err.message}`));
            }
            else {
                console.log(stdout);
                resolve();
            }
        });
    });
}
export function deactivate() { }
//# sourceMappingURL=extension.js.map