const { parse } = require('jsonc-parser');
const { exists } = require('../sub/util');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { glob } = require('glob');

async function generateItemTexture(rpPath) {

    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    const files = (await glob.glob('textures/**/items/**/*.{png,jpg,jpeg,tga}', { cwd: rpPath })).concat(...(await glob.glob('textures/items/**/*.{png,jpg,jpeg,tga}', { cwd: rpPath }))).map(file => file.replace(/\\/g, '/').replace(new RegExp(path.extname(file), 'g'), ''))

    if (!files.length) return;

    const atlasPath = path.join(rpPath, 'textures/item_texture.json');
    const fileExists = await exists(atlasPath);

    const output = fileExists ? parse((await fs.promises.readFile(atlasPath)).toString()) : { resource_pack_name: "rp", texture_name: "atlas.items" }

    output['texture_data'] = {};

    files.forEach(file => {
        const suffix = path.dirname(file).split('/').slice().reverse()[0]
        output.texture_data[path.basename(file) + (suffix != 'items' ? '_' + suffix : '')] = {
            textures: file
        }
    })

    if (fileExists) {
        const edit = new vscode.WorkspaceEdit()
        const uri = vscode.Uri.file(atlasPath);
        const strOutput = JSON.stringify(output, null, 4)

        edit.replace(uri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(strOutput.length, 0)), strOutput)
        vscode.workspace.applyEdit(edit)
    } else await fs.promises.writeFile(atlasPath, JSON.stringify(output, null, 4))

    vscode.window.setStatusBarMessage('item_texture.json generated', 2000)

}

module.exports = { generateItemTexture }