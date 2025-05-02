const { Form } = require('../sub/form');
const { exists } = require('../sub/util');

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { parse, stringify } = require('comment-json');

async function addBlockItem(filePath, bpPath, rpPath, system) {

    if (!filePath) { vscode.window.showErrorMessage('This command can only be executed via the right-click context menu'); return }
    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    filePath = filePath.slice(1)

    const itemAtlasPath = path.join(rpPath, 'textures/item_texture.json');
    const itemAtlas = await exists(itemAtlasPath) ? parse((await fs.promises.readFile(itemAtlasPath)).toString()) : { resource_pack_name: "rp", texture_name: "atlas.items", texture_data: {} };

    const answer = (await new Form([{ label: 'Icon Texture', description: 'Either a short name defined in the atlas, a texture path or None', type: 'radio', options: ["None"].concat(Array.from(system.getCache().textures.items).concat(Array.from(system.getCache().textures.paths))) }]).show()).toString()

    let key = answer != "None" ? answer : undefined;

    if (answer?.startsWith('textures/')) {
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
                "minecraft:block_placer": {
                    "block": blockJson['minecraft:block']['description']['identifier'],
                    "replace_block_item": true
                }
            }
        }
    }

    if (key) itemJson["minecraft:item"]["components"]["minecraft:icon"] = key;

    await fs.promises.writeFile(path.join(bpPath, `items/${blockJson['minecraft:block']['description']['identifier'].split(':')[1]}.json`), JSON.stringify(itemJson, null, 4))

    vscode.window.setStatusBarMessage('Block Item created for ' + blockJson['minecraft:block']['description']['identifier'], 2000)

}

module.exports = { addBlockItem }