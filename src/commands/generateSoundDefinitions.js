const { exists } = require('../sub/util');

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { glob } = require('glob');

async function generateSoundDefinitions(rpPath) {

    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    const files = (await glob.glob('sounds/**/*.{ogg,wav,mp3,fsb}', { cwd: rpPath })).map(file => file.replace(/\\/g, '/').replace('sounds/', '').replace(new RegExp(path.extname(file), 'g'), ''))

    if (!files.length) return;

    const filePath = path.join(rpPath, 'textures/item_texture.json');
    const fileExists = await exists(filePath);

    const output = {
        format_version: "1.20.80",
        sound_definitions: {}
    }

    files.forEach(file => {
        const group = path.dirname(file).replace(/\//g, '.')
        const type = path.basename(file).split('_')[0]
        const category = group + '.' + type
        if (output['sound_definitions'][category]) output['sound_definitions'][category]['sounds'].push('sounds/' + file)
        else output['sound_definitions'][category] = {
            category: "hostile",
            min_distance: 10,
            sounds: ['sounds/' + file]
        }
    })

    if (fileExists) {
        const edit = new vscode.WorkspaceEdit()
        const uri = vscode.Uri.file(filePath);
        const strOutput = JSON.stringify(output, null, 4)

        edit.replace(uri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(strOutput.length, 0)), strOutput)
        vscode.workspace.applyEdit(edit)
    } else await fs.promises.writeFile(filePath, JSON.stringify(output, null, 4))

    vscode.window.setStatusBarMessage('sound_definitions.json generated', 2000)

}

module.exports = { generateSoundDefinitions }