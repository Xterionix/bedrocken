const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

const downloadsFolder = path.join(os.homedir(), 'Downloads')

async function exportBp(bpPath) {

    let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
    if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
    location = downloadsFolder

    const extension = vscode.workspace.getConfiguration('bedrocken').get('export.fileType')
    const name = vscode.workspace.name.split(' (Workspace)')[0].split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(" ") + ' [BP].' + extension.split('/')[0]

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: 'Exporting BP',
        cancellable: false
    }, async () => {

        const output = fs.createWriteStream(path.join(location, name))

        const zip = archiver('zip', { zlib: { level: 9 } })

        zip.pipe(output)
        zip.glob('**/*', {
            cwd: bpPath,
            ignore: ['.git/**']
        });
        return zip.finalize()

    }).then(() => {
        vscode.window.showInformationMessage('Behavior Pack exported successfully', 'View in Folder').then(value => {
            if (value != 'View in Folder') return;
            vscode.commands.executeCommand('bedrocken.open_exports_folder')
        })
    });

}

module.exports = { exportBp, downloadsFolder }