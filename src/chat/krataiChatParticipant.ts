import * as vscode from 'vscode';

export function registerKrataiChatParticipant(context: vscode.ExtensionContext) {
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) => {
    try {
      // Load skill instructions from SKILL.md
      const skillPath = vscode.Uri.joinPath(context.extensionUri, 'skills', 'kratai', 'SKILL.md');
      const skillContent = await vscode.workspace.fs.readFile(skillPath);
      const skillInstructions = Buffer.from(skillContent).toString('utf8');

      // Check if MCP server tools might be available
      // Note: This is a hint in the skill instructions
      const mcpHint = `\n\nIMPORTANT: If you see "Kratai MCP not available" or cannot access kratai_* tools, tell the user to click "Start Server" when prompted by VS Code. The MCP server provides architecture diagram tools.\n\n`;

      // Use language model API - let user's model selection apply
      const models = await vscode.lm.selectChatModels();

      if (models.length === 0) {
        stream.markdown('⚠️ No language model available. Please ensure GitHub Copilot Chat is enabled.\n\n');
        return { metadata: { command: '' } };
      }

      // Use first available model (respects user's subscription/access)
      const model = models[0];

      // Build messages with skill instructions as context
      const messages = [
        vscode.LanguageModelChatMessage.User(skillInstructions + mcpHint),
        vscode.LanguageModelChatMessage.User(`User Request: ${request.prompt}`)
      ];

      // Send request to model
      const chatRequest = await model.sendRequest(messages, {}, token);

      // Stream the response back to user
      for await (const fragment of chatRequest.text) {
        stream.markdown(fragment);
      }

      return { metadata: { command: 'kratai' } };
    } catch (error) {
      stream.markdown(`⚠️ Error using Kratai: ${error}\n\n`);
      return { metadata: { command: '' } };
    }
  };

  // Create the chat participant
  const participant = vscode.chat.createChatParticipant('kratai.architect', handler);
  
  // Set icon
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.svg');
  
  context.subscriptions.push(participant);
  
  console.log('🐰 Kratai chat participant (@kratai) registered successfully');
}
