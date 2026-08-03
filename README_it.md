# Codex JS Autocomment

> Codex JS Autocomment è un'estensione per VS Code che usa Codex per aggiungere commenti JSDoc concisi al codice JavaScript selezionato, seguendo le istruzioni configurate nei settings oppure le regole del file AGENTS.md del progetto.

![](https://img.shields.io/badge/Made%20with%20love%20and-node-blue)
[![MIT license](https://img.shields.io/badge/License-MIT-green.svg)](https://lbesson.mit-license.org/)

## Funzionalità

- Commentare funzioni, classi o metodi JavaScript selezionati
- Generare JSDoc conciso direttamente sopra il codice selezionato
- Usare istruzioni personalizzate dai settings di VS Code
- Usare opzionalmente il file `AGENTS.md` del progetto come sorgente delle istruzioni
- Sostituire il codice selezionato con la versione commentata quando Codex termina
- Continuare a lavorare su altri file mentre Codex è in esecuzione

Questa estensione è pensata per workflow JavaScript e Node.js.

## Importante

Codex JS Autocomment è costruita specificamente per Codex.
Non è un'estensione AI generica e non è pensata per funzionare con altre CLI AI cambiando solo il percorso del comando.

L'estensione dipende dall'estensione OpenAI ChatGPT per VS Code:

```json
"extensionDependencies": [
	"openai.chatgpt"
]
```

Le istruzioni e la lingua dei commenti predefinite sono in italiano.
Gli utenti che parlano altre lingue dovrebbero modificare entrambi questi settings:

- `codexJsAutocomment.instructions`
- `codexJsAutocomment.commentLanguage`

## Utilizzo

Seleziona una funzione, classe o metodo JavaScript nell'editor.

Apri la Command Palette:

```
F1 oppure Ctrl+Shift+P (Cmd+Shift+P su macOS)
```

Digita **Codex JS Autocomment** ed esegui:

- **Codex JS Autocomment: Comment selected function**

Puoi anche usare la scorciatoia predefinita:

```
Ctrl+Alt+C
```

## Comandi

L'estensione fornisce il seguente comando:

- `codex-js-autocomment.commentSelection`

## Personalizzazione

Puoi configurare l'estensione in:

```
File > Preferences > Settings > cerca "Codex JS Autocomment"
```

### Sorgente delle istruzioni

Scegli da dove prendere le istruzioni del prompt:

```json
"codexJsAutocomment.instructionsSource": "settings"
```

Valori disponibili:

- `settings`: usa il testo di `codexJsAutocomment.instructions`
- `agents`: usa il file `AGENTS.md` del progetto quando esiste

Se `agents` è selezionato ma `AGENTS.md` non esiste nella root del workspace, l'estensione usa le istruzioni dei settings e mostra una notifica.

### Istruzioni predefinite

Le istruzioni predefinite incluse sono in italiano:

```json
"codexJsAutocomment.instructions": "Aggiungi JSDoc conciso e utile immediatamente sopra la funzione, classe o metodo interessato.\nSpiega lo scopo, i vincoli rilevanti, gli effetti collaterali e i comportamenti non evidenti.\nUsa @param solo quando esistono parametri.\nUsa @returns solo quando la funzione restituisce un valore significativo.\nUsa @throws solo quando la funzione può realmente generare un'eccezione.\nUsa tipi precisi.\nNon modificare l'implementazione, salvo richiesta esplicita.\nEvita documentazione eccessiva per getter, setter o funzioni autoesplicative.\nRestituisci solo il codice aggiornato, senza spiegazioni."
```

Gli utenti che lavorano in un'altra lingua dovrebbero tradurre questo prompt e impostare la lingua desiderata per i commenti.

Esempio:

```json
{
	"codexJsAutocomment.commentLanguage": "English",
	"codexJsAutocomment.instructions": "Add concise and useful JSDoc immediately above the selected function, class, or method.\nExplain purpose, relevant constraints, side effects, and non-obvious behavior.\nUse @param only when parameters exist.\nUse @returns only when the function returns a meaningful value.\nUse @throws only when the function can actually throw an exception.\nUse precise types.\nDo not change the implementation unless explicitly requested.\nAvoid excessive documentation for getters, setters, or self-explanatory functions.\nReturn only the updated code, without explanations."
}
```

### Comando Codex

Di default l'estensione usa:

```json
"codexJsAutocomment.codexCommand": "codex"
```

Quando questo valore resta `codex`, l'estensione prova anche a trovare il binario Codex incluso nell'estensione OpenAI ChatGPT per VS Code.

Usa un percorso personalizzato solo quando necessario:

```json
"codexJsAutocomment.codexCommand": "/path/to/codex"
```

## Scorciatoie da tastiera

L'estensione definisce questa scorciatoia predefinita:

```json
{
	"key": "ctrl+alt+c",
	"command": "codex-js-autocomment.commentSelection",
	"when": "editorTextFocus && editorHasSelection"
}
```

Puoi modificarla in:

```
Preferences > Keyboard Shortcuts
```

## Compatibilità

Questa estensione funziona solo su VS Code Desktop. Non è supportata su VS Code Web (vscode.dev / github.dev).

Richiede Codex disponibile tramite l'estensione OpenAI ChatGPT oppure tramite un comando Codex locale.

## Note

- Il codice selezionato viene inviato a Codex per l'elaborazione
- L'estensione chiede a Codex di restituire solo il codice aggiornato
- La selezione originale viene sostituita solo se il documento originale non è cambiato mentre Codex era in esecuzione
- L'avvio di Codex può essere più lento rispetto a strumenti dedicati alla documentazione perché la CLI viene avviata a ogni richiesta
- Istruzioni personalizzate più brevi di solito rendono più veloce la generazione del commento
- Usa `codexJsAutocomment.instructionsSource: "settings"` quando non ti servono le regole di progetto da `AGENTS.md`, perché caricare il contesto del progetto può aggiungere latenza

## Perché Codex JS Autocomment?

Scrivere JSDoc utile è ripetitivo, ma le regole del progetto contano.
Codex JS Autocomment offre una scorciatoia rapida per il codice JavaScript selezionato mantenendo configurabili istruzioni, lingua e stile di documentazione.

## DevTeam

### ARMADA 429
<img src="https://raw.githubusercontent.com/saiballo/saiballo/refs/heads/master/armada429.png" width="80" height="80">
<br><br>

**Lorenzo "Saibal" Forti** - <lorenzo.forti@gmail.com>

## Licenza

[![MIT license](https://img.shields.io/badge/License-MIT-green.svg)](https://lbesson.mit-license.org/)
![](https://img.shields.io/badge/License-Copyleft%20Saibal%20--%20All%20Rights%20Reserved-red)
