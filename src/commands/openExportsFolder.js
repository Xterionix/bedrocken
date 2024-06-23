const { downloadsFolder } = require('./exportBp');

const vscode = require('vscode');
const os = require('os');
const path = require('path');
const { exec } = require('child_process')

const explorerCommand = {
    "win32": "explorer",
    "darwin": "open",
    "linux": "xdg-open"
}

function openExportsFolder() {

    let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
    if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
    location = downloadsFolder

    const userOS = os.platform()

    if (!Object.keys(explorerCommand).includes(userOS)) {
        vscode.window.showErrorMessage('Unsupported OS: ', userOS)
        return;
    }

    const command = explorerCommand[userOS]

    exec(`${command} ${path.join(location)}`, (err, stdout, stderr) => {
        if (err || stderr) {
            console.warn('Err: ' + err, 'Std err: ' + stderr)
            return;
        }
    })

}

module.exports = { openExportsFolder }