const { parse } = require('jsonc-parser');
const { exists } = require('../sub/util');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { glob } = require('glob');

async function generateTerrainTexture(rpPath) {

    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    const files = (await glob.glob('textures/**/blocks/*.{png,jpg,jpeg,tga}', { cwd: rpPath })).map(file => file.replace(/\\/g, '/').replace(new RegExp(path.extname(file), 'g'), ''))

    if (!files.length) return;

    const atlasPath = path.join(rpPath, 'textures/terrain_texture.json');

    const output = await exists(atlasPath) ? parse((await fs.promises.readFile(atlasPath)).toString()) : { resource_pack_name: "rp", texture_name: "atlas.terrain" }

    output['texture_data'] = {};

    files.forEach(file => {
        const suffix = path.dirname(file).split('/').slice().reverse()[0]
        output.texture_data[path.basename(file) + (suffix != 'blocks' ? '_' + suffix : '')] = {
            textures: file
        }
    })

    await fs.promises.writeFile(atlasPath, JSON.stringify(output, null, 4))

    vscode.window.setStatusBarMessage('terrain_texture.json generated', 2000)

}

module.exports = { generateTerrainTexture }