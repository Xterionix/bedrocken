const { downloadsFolder } = require('./exportBp');

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

async function exportProject() {

    let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
    if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
    location = downloadsFolder

    const extension = vscode.workspace.getConfiguration('bedrocken').get('export.file_type')
    const name = vscode.workspace.name.split(' (Workspace)')[0].split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(" ") + '.' + extension.split('/').pop()

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: 'Exporting Project',
        cancellable: false
    }, async () => {

        const output = fs.createWriteStream(path.join(os.homedir(), 'Downloads', name))

        const zip = archiver('zip', { zlib: { level: 9 } })
        zip.pipe(output)
        vscode.workspace.workspaceFolders.forEach(folder => {
            zip.glob('**/*', {
                cwd: folder.uri.fsPath,
                ignore: ['.git/**']
            }, { prefix: folder.name });
        });
        return zip.finalize()

    }).then(() => {
        vscode.window.showInformationMessage('Project exported successfully', 'View in Folder').then(value => {
            if (value != 'View in Folder') return;
            vscode.commands.executeCommand('bedrocken.open_exports_folder')
        })
    });

}

module.exports = { exportProject }