const { parse } = require('jsonc-parser');

const { downloadsFolder, ignoreFolders } = require('./exportBp');

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function exportProject(bpPath, rpPath) {

    let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
    if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
    location = downloadsFolder

    const extension = vscode.workspace.getConfiguration('bedrocken').get('export.fileType')

    let projectName = parse((await fs.promises.readFile(path.join(bpPath, 'manifest.json'))).toString())['header']['name'];
    if (projectName == 'pack.name' || !projectName) projectName = (await fs.promises.readFile(path.join(bpPath, 'texts/en_US.lang'))).toString().split('\n').filter(line => line.startsWith('pack.name'))[0].replace('pack.name=', '');

    projectName = projectName.replace(/(\b[bB][pP]\b|\b[rR][pP]\b)|([^a-zA-Z0-9\-\_\. ])/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
    projectName += '.' + extension.split('/').pop();

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: 'Exporting Project',
        cancellable: false
    }, async () => {

        const output = fs.createWriteStream(path.join(location, projectName))

        const zip = archiver('zip', { zlib: { level: 9 } })
        zip.pipe(output);
        zip.glob('**/*', {
            cwd: bpPath,
            ignore: ignoreFolders
        }, { prefix: 'BP' });
        zip.glob('**/*', {
            cwd: rpPath,
            ignore: ignoreFolders
        }, { prefix: 'RP' });
        return zip.finalize()

    }).then(() => {
        vscode.window.showInformationMessage('Project exported successfully', 'View in Folder').then(value => {
            if (value != 'View in Folder') return;
            vscode.commands.executeCommand('bedrocken.open_exports_folder')
        })
    });

}

module.exports = { exportProject }