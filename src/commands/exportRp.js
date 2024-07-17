const { downloadsFolder } = require('./exportBp');

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function exportRp() {

    if (vscode.workspace.workspaceFolders.length == 1) {
        vscode.window.showErrorMessage('No resource pack found')
        return;
    }

    let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
    if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
    location = downloadsFolder

    const extension = vscode.workspace.getConfiguration('bedrocken').get('export.fileType')
    const name = vscode.workspace.name.split(' (Workspace)')[0].split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(" ") + ' [RP].' + extension.split('/')[0]

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: 'Exporting RP',
        cancellable: false
    }, async () => {

        const output = fs.createWriteStream(path.join(location, name))

        const zip = archiver('zip', { zlib: { level: 9 } })

        zip.pipe(output)
        zip.glob('**/*', {
            cwd: vscode.workspace.workspaceFolders[1].uri.fsPath,
            ignore: ['.git/**']
        });
        return zip.finalize()

    }).then(() => {
        vscode.window.showInformationMessage('Resource Pack exported successfully', 'View in Folder').then(value => {
            if (value != 'View in Folder') return;
            vscode.commands.executeCommand('bedrocken.open_exports_folder')
        })
    });

}

module.exports = { exportRp }