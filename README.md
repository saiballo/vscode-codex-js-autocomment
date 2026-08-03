# Codex JS Autocomment

> Codex JS Autocomment is a VS Code extension that uses Codex to add concise JSDoc comments to selected JavaScript code, following either the extension settings or the project AGENTS.md rules.

![](https://img.shields.io/badge/Made%20with%20love%20and-node-blue)
[![MIT license](https://img.shields.io/badge/License-MIT-green.svg)](https://lbesson.mit-license.org/)

## Features

- Comment selected JavaScript functions, classes, or methods
- Generate concise JSDoc directly above the selected code
- Use custom prompt instructions from VS Code settings
- Optionally use the project `AGENTS.md` file as the instruction source
- Replace the selected code with the commented version when Codex completes
- Keep working in other files while Codex is running

This extension is designed for JavaScript and Node.js workflows.

## Important

Codex JS Autocomment is built specifically for Codex.
It is not a generic AI extension and is not intended to work with other AI CLIs by only changing the command path.

The extension depends on the OpenAI ChatGPT extension for VS Code:

```json
"extensionDependencies": [
	"openai.chatgpt"
]
```

The default prompt and comment language are written in Italian. If you want to use the extension in another language, update both:

- `codexJsAutocomment.instructions`
- `codexJsAutocomment.commentLanguage`

## Usage

Select a JavaScript function, class, or method in the editor.

Open the Command Palette:

```
F1 or Ctrl+Shift+P (Cmd+Shift+P on macOS)
```

Type **Codex JS Autocomment** and run:

- **Codex JS Autocomment: Comment selected function**

You can also use the default keybinding:

```
Ctrl+Alt+C
```

## Commands

The extension provides the following command:

- `codex-js-autocomment.commentSelection`

## Customization

You can configure the extension in:

```
File > Preferences > Settings > search "Codex JS Autocomment"
```

### Instruction source

Choose where the prompt instructions come from:

```json
"codexJsAutocomment.instructionsSource": "settings"
```

Available values:

- `settings`: use the text from `codexJsAutocomment.instructions`
- `agents`: use the project `AGENTS.md` file when it exists

If `agents` is selected but `AGENTS.md` does not exist in the workspace root, the extension falls back to the settings instructions and shows a notification.

### Default instructions

The bundled default instructions are in Italian:

```json
"codexJsAutocomment.instructions": "Aggiungi JSDoc conciso e utile immediatamente sopra la funzione, classe o metodo interessato.\nSpiega lo scopo, i vincoli rilevanti, gli effetti collaterali e i comportamenti non evidenti.\nUsa @param solo quando esistono parametri.\nUsa @returns solo quando la funzione restituisce un valore significativo.\nUsa @throws solo quando la funzione può realmente generare un'eccezione.\nUsa tipi precisi.\nNon modificare l'implementazione, salvo richiesta esplicita.\nEvita documentazione eccessiva per getter, setter o funzioni autoesplicative.\nRestituisci solo il codice aggiornato, senza spiegazioni."
```

Foreign-language users should translate this prompt and set their preferred comment language.

Example:

```json
{
	"codexJsAutocomment.commentLanguage": "English",
	"codexJsAutocomment.instructions": "Add concise and useful JSDoc immediately above the selected function, class, or method.\nExplain purpose, relevant constraints, side effects, and non-obvious behavior.\nUse @param only when parameters exist.\nUse @returns only when the function returns a meaningful value.\nUse @throws only when the function can actually throw an exception.\nUse precise types.\nDo not change the implementation unless explicitly requested.\nAvoid excessive documentation for getters, setters, or self-explanatory functions.\nReturn only the updated code, without explanations."
}
```

### Codex command

By default, the extension uses:

```json
"codexJsAutocomment.codexCommand": "codex"
```

When this value is left as `codex`, the extension also tries to find the Codex binary bundled with the OpenAI ChatGPT extension for VS Code.

Use a custom path only when needed:

```json
"codexJsAutocomment.codexCommand": "/path/to/codex"
```

## Keybindings

The extension defines this default keybinding:

```json
{
	"key": "ctrl+alt+c",
	"command": "codex-js-autocomment.commentSelection",
	"when": "editorTextFocus && editorHasSelection"
}
```

You can change it in:

```
Preferences > Keyboard Shortcuts
```

## Compatibility

This extension works only in VS Code Desktop. It is not supported in VS Code Web (vscode.dev / github.dev).

It requires Codex to be available through the OpenAI ChatGPT extension or through a local Codex command.

## Notes

- Selected code is sent to Codex for processing
- The extension asks Codex to return only the updated code
- The original selection is replaced only when the original document has not changed while Codex was running
- Codex startup can be slower than dedicated documentation tools because the CLI is launched for each request
- Shorter custom instructions usually make comment generation faster
- Use `codexJsAutocomment.instructionsSource: "settings"` when you do not need project-level `AGENTS.md` rules, because loading project context can add latency

## Why Codex JS Autocomment?

Writing useful JSDoc is repetitive, but project rules matter.
Codex JS Autocomment gives you a quick shortcut for selected JavaScript code while keeping your project instructions, language, and documentation style configurable.

## DevTeam

### ARMADA 429
<img src="https://raw.githubusercontent.com/saiballo/saiballo/refs/heads/master/armada429.png" width="80" height="80">
<br><br>

**Lorenzo "Saibal" Forti** - <lorenzo.forti@gmail.com>

## License

[![MIT license](https://img.shields.io/badge/License-MIT-green.svg)](https://lbesson.mit-license.org/)
![](https://img.shields.io/badge/License-Copyleft%20Saibal%20--%20All%20Rights%20Reserved-red)
