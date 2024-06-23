const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { glob } = require('glob');

async function generateTextureList(rpPath) {

    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    const files = await glob.glob('textures/**/*.{png,jpg,jpeg,tga}', { cwd: rpPath })

    if (!files.length) return;

    await fs.promises.writeFile(path.join(rpPath, 'textures/texture_list.json'), JSON.stringify(files.map(file => file.replace(new RegExp(path.extname(file), 'g'), '').replace(/\\/g, '/')), null, 4))

    vscode.window.setStatusBarMessage('texture_list.json generated', 2000)

}

module.exports = { generateTextureList }