const { Form } = require('../sub/form');
const { exists } = require('../sub/util');

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { parse, stringify } = require('comment-json');

async function addBlockIcon(filePath, bpPath, rpPath, system) {

    if (!filePath) { vscode.window.showErrorMessage('This command can only be executed via the right-click context menu'); return }
    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    filePath = filePath.slice(1)

    const itemAtlasPath = path.join(rpPath, 'textures/item_texture.json');
    const itemAtlas = await exists(itemAtlasPath) ? parse((await fs.promises.readFile(itemAtlasPath)).toString()) : { resource_pack_name: "rp", texture_name: "atlas.items", texture_data: {} };

    const answer = (await new Form([{ label: 'Icon Texture', description: 'Either a short name defined in the atlas or a texture path', type: 'radio', options: system.getCache().textures.items.concat(system.getCache().textures.paths) }]).show()).toString()

    if (!answer) return;

    let key = answer;

    if (answer.startsWith('textures/')) {
        key = path.basename(answer.toString())
        if (system.getCache().textures.items.includes(key)) key += '1'
        itemAtlas['texture_data'][key] = {
            textures: answer
        }
        const edit = new vscode.WorkspaceEdit()
        const uri = vscode.Uri.file(itemAtlasPath);
        const strOutput = stringify(itemAtlas, null, 4)

        edit.replace(uri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(strOutput.length, 0)), strOutput)
        await vscode.workspace.applyEdit(edit)
    }

    const blockJson = parse((await fs.promises.readFile(filePath)).toString());
    delete blockJson['minecraft:block']['description']['menu_category']
    const blockEdit = new vscode.WorkspaceEdit()
    const uri = vscode.Uri.file(filePath);
    const blockOutput = stringify(blockJson, null, 4)

    blockEdit.replace(uri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(blockOutput.length, 0)), blockOutput)
    await vscode.workspace.applyEdit(blockEdit)

    const itemJson = {
        "format_version": "1.21.50",
        "minecraft:item": {
            "description": {
                "identifier": blockJson['minecraft:block']['description']['identifier']
            },
            "components": {
                "minecraft:icon": key,
                "minecraft:block_placer": {
                    "block": blockJson['minecraft:block']['description']['identifier']
                }
            }
        }
    }

    await fs.promises.writeFile(path.join(bpPath, `items/${blockJson['minecraft:block']['description']['identifier'].split(':')[1]}.json`), JSON.stringify(itemJson, null, 4))

    vscode.window.setStatusBarMessage('Icon added to ' + blockJson['minecraft:block']['description']['identifier'], 2000)

}

module.exports = { addBlockIcon }