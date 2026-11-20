/**
* @preserve
* Filename: extension.js
*
* Created: 02/08/2026 (18:36:52)
* Created by: Lorenzo Saibal Forti <lorenzo.forti@gmail.com>
*
* Last update: 14/10/2026 (19:46:26)
* Updated by: Lorenzo Saibal Forti <lorenzo.forti@gmail.com>
*
* Copyleft: 2026 - Tutti i diritti riservati
*
* Comments:
*/

"use strict";

const vscode = require("vscode");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const commandId = "codex-js-autocomment.commentSelection";
const extensionName = "Codex JS Autocomment";
const messagePrefix = `${extensionName}:`;
const defaultInstructions = "Aggiungi JSDoc conciso e utile alla selezione. Non modificare l'implementazione. Restituisci solo il codice aggiornato, senza spiegazioni.";

/**
 * Registra il comando principale dell'estensione e lo collega al ciclo di vita di VS Code.
 *
 * @param {vscode.ExtensionContext} context Contesto dell'estensione usato per gestire le subscription.
 */
const activate = (context) => {

	const disposable = vscode.commands.registerCommand(commandId, commentSelection);

	context.subscriptions.push(disposable);
};

/**
 * Commenta la selezione corrente con Codex e sostituisce il testo originale solo se il documento non è cambiato nel frattempo.
 */
const commentSelection = async () => {

	const editor = vscode.window.activeTextEditor;

	if (typeof editor === "undefined" || editor === null) {

		vscode.window.showWarningMessage(`${messagePrefix}: no active editor.`);

		return;
	}

	if (editor.selection.isEmpty) {

		vscode.window.showWarningMessage(`${messagePrefix}: select a function before running the command.`);

		return;
	}

	const { selection, document } = editor;
	const documentUri = document.uri;
	const documentVersion = document.version;
	const selectedCode = document.getText(selection);
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
	const cwd = typeof workspaceFolder !== "undefined" && workspaceFolder !== null ? workspaceFolder.uri.fsPath : path.dirname(documentUri.fsPath);
	const config = vscode.workspace.getConfiguration("codexJsAutocomment");
	const codexCommand = config.get("codexCommand", "codex");
	const commentLanguage = config.get("commentLanguage", "italiano");
	const instructionsSource = config.get("instructionsSource", "settings");
	const instructions = getInstructions({
		config,
		cwd,
		instructionsSource
	});

	try {

		const updatedCode = await vscode.window.withProgress({
			"location": vscode.ProgressLocation.Notification,
			"title": `${messagePrefix} commenting selection`,
			"cancellable": true
		},
		(_progress, token) => runCodex({
			codexCommand,
			cwd,
			"fileName": document.fileName,
			"languageId": document.languageId,
			selectedCode,
			instructions,
			commentLanguage,
			token
		}));

		if (updatedCode.trim().length === 0) {

			vscode.window.showWarningMessage(`${messagePrefix}: Codex returned an empty response.`);
			return;
		}

		const currentDocument = getCurrentDocument(documentUri);

		if (typeof currentDocument !== "undefined" && currentDocument !== null && currentDocument.version !== documentVersion) {

			vscode.window.showWarningMessage(`${messagePrefix}: the original document changed while Codex was running. Selection was not replaced.`);
			return;
		}

		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.replace(documentUri, selection, updatedCode);

		const applied = await vscode.workspace.applyEdit(workspaceEdit);

		if (applied === false) {

			vscode.window.showWarningMessage(`${messagePrefix}: could not replace the original selection.`);
		}

	} catch (error) {

		const message = error instanceof Error ? error.message : String(error);

		vscode.window.showErrorMessage(`${messagePrefix}: ${message}`);
	}
};

/**
 * Recupera il documento aperto corrispondente all'URI originale della selezione.
 *
 * @param {vscode.Uri} documentUri URI del documento da cercare tra quelli aperti.
 * @returns {vscode.TextDocument | undefined}
 */
const getCurrentDocument = (documentUri) => {

	return vscode.workspace.textDocuments.find((textDocument) => {

		return textDocument.uri.toString() === documentUri.toString();
	});
};

/**
 * Determina quali istruzioni passare a Codex usando il file AGENTS.md quando richiesto e disponibile.
 *
 * @param {object} options Opzioni per risolvere la sorgente delle istruzioni.
 * @param {vscode.WorkspaceConfiguration} options.config Configurazione dell'estensione.
 * @param {string} options.cwd Root di lavoro in cui cercare AGENTS.md.
 * @param {string} options.instructionsSource Sorgente configurata per le istruzioni.
 * @returns {string}
 */
const getInstructions = ({ config, cwd, instructionsSource }) => {

	if (instructionsSource === "agents") {

		const agentsPath = path.join(cwd, "AGENTS.md");

		if (fs.existsSync(agentsPath)) {

			return "Use the project AGENTS.md instructions to comment the selection. Return only the updated code, without explanations.";
		}

		vscode.window.showInformationMessage(`${messagePrefix}: using default instructions because the AGENTS.md file does not exist.`);
	}

	return getConfiguredInstructions(config);
};

/**
 * Legge le istruzioni configurate nei settings e usa un fallback quando il valore è assente o vuoto.
 *
 * @param {vscode.WorkspaceConfiguration} config Configurazione dell'estensione.
 * @returns {string}
 */
const getConfiguredInstructions = (config) => {

	const configuredInstructions = config.get("instructions");

	if (typeof configuredInstructions !== "undefined" && configuredInstructions !== null && configuredInstructions.trim().length > 0) {

		return configuredInstructions;
	}

	return defaultInstructions;
};

/**
 * Esegue Codex in modalità non interattiva e restituisce l'ultimo messaggio prodotto dal comando.
 *
 * @param {object} options Opzioni necessarie per costruire ed eseguire il comando Codex.
 * @param {string} options.codexCommand Comando o percorso dell'eseguibile Codex.
 * @param {string} options.cwd Root di lavoro da passare a Codex.
 * @param {string} options.fileName Percorso del file da usare come contesto nel prompt.
 * @param {string} options.languageId Linguaggio VS Code del documento selezionato.
 * @param {string} options.selectedCode Codice selezionato da commentare.
 * @param {string} options.instructions Istruzioni operative da includere nel prompt.
 * @param {string} options.commentLanguage Lingua richiesta per i commenti.
 * @param {vscode.CancellationToken} options.token Token usato per annullare il processo.
 * @returns {Promise<string>}
 */
const runCodex = ({codexCommand, cwd, fileName, languageId, selectedCode, instructions, commentLanguage, token}) => {

	return new Promise((resolve, reject) => {

		const commandParts = resolveCodexCommand(codexCommand);
		const command = commandParts.shift();

		if (typeof command === "undefined" || command === null || command.length === 0) {

			reject(new Error("missing Codex command."));
			return;
		}

		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-js-autocomment-"));
		const outputPath = path.join(tmpDir, "codex-output.txt");
		const args = [
			...commandParts,
			"exec",
			"--cd",
			cwd,
			"--sandbox",
			"read-only",
			"--skip-git-repo-check",
			"--ephemeral",
			"--color",
			"never",
			"--output-last-message",
			outputPath,
			"-"
		];
		const child = spawn(command, args, {cwd});
		let stdout = "";
		let stderr = "";
		let settled = false;

		const cancel = token.onCancellationRequested(() => {
			settled = true;
			child.kill();
			cleanup(tmpDir);
			reject(new Error("operation cancelled."));
		});

		child.stdout.on("data", (chunk) => {
			stdout += chunk.toString();
		});

		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		child.on("error", (error) => {

			if (settled) return;

			settled = true;
			cancel.dispose();
			cleanup(tmpDir);
			reject(error);
		});

		child.on("close", (code) => {

			if (settled) return;

			settled = true;
			cancel.dispose();

			if (code !== 0) {

				cleanup(tmpDir);
				reject(new Error(formatCodexError(code, stderr, stdout)));

				return;
			}

			const output = readOutput(outputPath, stdout);
			cleanup(tmpDir);
			resolve(stripCodeFence(output).trim());
		});

		child.stdin.end(buildPrompt({
			fileName,
			languageId,
			selectedCode,
			instructions,
			commentLanguage
		}));
	});
};

/**
 * Costruisce il prompt finale unendo istruzioni, vincoli operativi e codice selezionato.
 *
 * @param {object} options Dati da includere nel prompt.
 * @param {string} options.fileName Percorso del file selezionato.
 * @param {string} options.languageId Linguaggio VS Code del documento.
 * @param {string} options.selectedCode Codice selezionato da commentare.
 * @param {string} options.instructions Istruzioni personalizzate o derivate da AGENTS.md.
 * @param {string} options.commentLanguage Lingua richiesta per i commenti.
 * @returns {string}
 */
const buildPrompt = ({fileName, languageId, selectedCode, instructions, commentLanguage}) => [
	instructions,
	"",
	"Regole operative:",
	"- Usa le regole del progetto disponibili nel workspace, inclusi eventuali AGENTS.md.",
	"- Scrivi i commenti in " + commentLanguage + ".",
	"- Se il progetto richiede JSDoc, usa JSDoc valido: descrizione come testo normale e tag @param/@returns separati.",
	"- Non usare elenchi puntati dentro il blocco JSDoc, a meno che le regole del progetto lo richiedano esplicitamente.",
	"- Aggiungi o aggiorna solo i commenti necessari per la funzione selezionata.",
	"- Non cambiare il comportamento del codice.",
	"- Restituisci esclusivamente il codice completo della selezione aggiornata.",
	"- Non includere markdown, spiegazioni, diff o testo introduttivo.",
	"",
	"File: " + fileName,
	"Linguaggio VS Code: " + languageId,
	"",
	"<selected_code>",
	selectedCode,
	"</selected_code>"
].join("\n");

/**
 * Divide una riga comando in argomenti preservando stringhe racchiuse tra apici.
 *
 * @param {string} commandLine Comando configurato dall'utente.
 * @returns {string[]}
 */
const splitCommand = (commandLine) => {

	const parts = [];
	const pattern = /"([^"]*)"|'([^']*)'|[^\s]+/g;
	let match;

	while ((match = pattern.exec(commandLine)) !== null) {

		parts.push(getFirstDefinedMatch(match));
	}

	return parts;
};

/**
 * Restituisce il primo gruppo di cattura definito, gestendo espressioni regolari
 * con alternative in cui alcuni gruppi possono essere assenti.
 *
 * @param {RegExpMatchArray} match Risultato della corrispondenza dell'espressione regolare.
 * @returns {string} Il primo valore definito tra i gruppi di cattura e la corrispondenza completa.
 */
const getFirstDefinedMatch = (match) => {

	if (typeof match[1] !== "undefined" && match[1] !== null) {

		return match[1];
	}

	if (typeof match[2] !== "undefined" && match[2] !== null) {

		return match[2];
	}

	return match[0];
};

/**
 * Risolve il comando Codex configurato e usa il binario incluso nell'estensione ChatGPT quando disponibile.
 *
 * @param {string} codexCommand Comando o percorso configurato nei settings.
 * @returns {string[]}
 */
const resolveCodexCommand = (codexCommand) => {

	const commandParts = splitCommand(codexCommand);
	const command = commandParts[0];

	if (typeof command !== "undefined" && command !== null && command !== "codex") {

		return commandParts;
	}

	const bundledCodex = findBundledCodex();

	if (bundledCodex.length > 0) {

		return [bundledCodex, ...commandParts.slice(1)];
	}

	return commandParts;
};

/**
 * Cerca il binario Codex distribuito con l'estensione OpenAI/ChatGPT di VS Code.
 *
 * @returns {string}
 */
const findBundledCodex = () => {

	const chatGptExtension = vscode.extensions.getExtension("openai.chatgpt");

	if (typeof chatGptExtension === "undefined" || chatGptExtension === null) return "";

	const binDir = path.join(chatGptExtension.extensionPath, "bin");
	const executableName = process.platform === "win32" ? "codex.exe" : "codex";

	return findFile(binDir, executableName);
};

/**
 * Cerca ricorsivamente un file dentro una directory.
 *
 * @param {string} rootDir Directory da cui iniziare la ricerca.
 * @param {string} fileName Nome del file da trovare.
 * @returns {string}
 */
const findFile = (rootDir, fileName) => {

	if (fs.existsSync(rootDir) === false) return "";

	const entries = fs.readdirSync(rootDir, {
		"withFileTypes": true
	});

	for (const entry of entries) {

		const entryPath = path.join(rootDir, entry.name);

		if (entry.isFile() && entry.name === fileName) return entryPath;

		if (entry.isDirectory()) {

			const nestedFile = findFile(entryPath, fileName);

			if (nestedFile.length > 0) return nestedFile;
		}
	}

	return "";
};

/**
 * Legge l'output scritto su file da Codex e usa stdout come fallback.
 *
 * @param {string} outputPath Percorso del file con l'ultimo messaggio Codex.
 * @param {string} fallback Output alternativo da usare quando il file non esiste.
 * @returns {string}
 */
const readOutput = (outputPath, fallback) => {

	if (fs.existsSync(outputPath)) {

		return fs.readFileSync(outputPath, "utf8");
	}

	return fallback;
};

/**
 * Rimuove un eventuale code fence markdown quando Codex restituisce il codice dentro un blocco.
 *
 * @param {string} output Testo restituito da Codex.
 * @returns {string}
 */
const stripCodeFence = (output) => {

	const trimmed = output.trim();
	const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n```$/);

	if (match !== null) return match[1];

	return output;
};

/**
 * Prepara un messaggio di errore leggibile usando stderr quando disponibile.
 *
 * @param {number | null} code Codice di uscita del processo Codex.
 * @param {string} stderr Output di errore del processo.
 * @param {string} stdout Output standard del processo.
 * @returns {string}
 */
const formatCodexError = (code, stderr, stdout) => {

	const details = stderr.length > 0 ? stderr.trim() : stdout.trim();

	if (details.length === 0) {

		return "Codex exited with code " + code + ".";
	}

	return "Codex exited with code " + code + ": " + details;
};

/**
 * Elimina la directory temporanea creata per raccogliere l'output di Codex.
 *
 * @param {string} tmpDir Directory temporanea da rimuovere.
 */
const cleanup = (tmpDir) => {

	try {

		fs.rmSync(tmpDir, {
			"recursive": true,
			"force": true
		});

	} catch (_error) {}
};

const deactivate = () => {};

module.exports = {
	activate,
	deactivate
};
