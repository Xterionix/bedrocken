const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { glob } = require('glob');

async function generateItemTexture(rpPath) {

    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    const files = (await glob.glob('textures/**/*.{png,jpg,jpeg,tga}', { cwd: rpPath })).map(file => file.replace(/\\/g, '/').replace(new RegExp(path.extname(file), 'g'), ''))

    if (!files.length) return;

    const output = {
        resource_pack_name: "rp",
        texture_name: "atlas.items",
        texture_data: {}
    }

    files.forEach(file => {
        console.warn(path.basename(file) + '_' + path.dirname(file).split('/').slice().reverse()[0])
        output.texture_data[path.basename(file) + '_' + path.dirname(file).split('/').slice().reverse()[0]] = {
            textures: file
        }
    })

    await fs.promises.writeFile(path.join(rpPath, 'textures/item_texture.json'), JSON.stringify(output, null, 4))

    vscode.window.setStatusBarMessage('item_texture.json generated', 2000)

}

module.exports = { generateItemTexture }