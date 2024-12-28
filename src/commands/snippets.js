const { identifyFileType } = require('../sub/fileType');

const { mergeDeep } = require('../sub/util');
const { getAllFilePaths } = require('../sub/cacheSystem');

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const { parse, stringify } = require('comment-json');

/**
 * @param {vscode.ExtensionContext} context
 * @param {string} bpPath
 * @param {string|undefined} rpPath
 */
async function snippets(context, bpPath, rpPath) {

    const snippetFiles = await getAllFilePaths(path.join(context.extensionPath, 'data/snippets'))
    let snippets = await Promise.all(snippetFiles.map(async snippet => JSON.parse((await fs.promises.readFile(snippet)).toString())))

    if (!vscode.window.activeTextEditor) { vscode.window.showErrorMessage('Snippets can only be run when you have a file open'); return };

    const document = vscode.window.activeTextEditor.document
    const workspace = document.uri.fsPath.startsWith(bpPath) ? bpPath : rpPath
    const fileContent = parse(document.getText())
    const packType = workspace == bpPath ? "bp" : "rp"

    snippets = snippets.filter(snippet => snippet.fileType == identifyFileType(document.uri.fsPath)).filter(snippet => snippet.packType == packType).filter(snippet => document.fileName.endsWith(snippet.fileExtension))

    if (snippets.length == 0) { vscode.window.showErrorMessage('No snippets found for this file type'); return };

    vscode.window.showQuickPick(snippets.map(x => ({ label: x.name, description: x.description }))).then(selectedOption => {
        if (!selectedOption) return;
        const i = snippets.findIndex(x => x.name == selectedOption.label)
        snippets[i].insertions.forEach(insertion => {
            const arr = insertion.path
            let current = fileContent;
            for (let i = 0; i < arr.length; i++) {
                if (!current[arr[i]]) current[arr[i]] = {}
                current = current[arr[i]];
            }
            current = mergeDeep(current, insertion.data)
        })
        const edit = new vscode.WorkspaceEdit()
        edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), stringify(fileContent, null, 4))
        vscode.workspace.applyEdit(edit)
    })

}

module.exports = { snippets }