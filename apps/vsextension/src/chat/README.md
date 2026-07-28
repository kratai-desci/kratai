# Kratai Chat Participant

This module implements the `@kratai` chat participant for VS Code Copilot Chat.

## Usage

Users can invoke the Kratai architecture-aware coding assistant by typing:

```
@kratai build a feature for class attendance tracking
```

## How It Works

1. User types `@kratai` followed by their request
2. The chat participant loads the skill instructions from `/skills/kratai/SKILL.md`
3. The skill instructions guide Copilot's behavior with architecture principles
4. Copilot responds with architecture-aware code suggestions

## Architecture Principles

The Kratai assistant enforces:
- **SRP** (Single Responsibility Principle)
- **DRY** (Don't Repeat Yourself)
- **YAGNI** (You Aren't Gonna Need It)
- **KISS** (Keep It Simple, Stupid)
- **High Cohesion** / **Low Coupling**

It also uses kratai MCP tools to understand the codebase architecture before suggesting code.

## Implementation

- `krataiChatParticipant.ts` - Main chat participant implementation
- Registered in `extension.ts` on activation
- Configured in `package.json` under `chatParticipants`
