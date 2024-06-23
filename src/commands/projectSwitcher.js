const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { parse } = require('jsonc-parser');

const appData = process.env.APPDATA

/**
 * @param {vscode.ExtensionContext} context 
 */
async function projectSwitcher(context) {

    try {

        const root = vscode.workspace.getConfiguration('bedrocken').get('folders', [`${appData.replace(/\\/g, '').replace('Roaming', '')}//Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang`])
        const options = []

        /**
         * @typedef PackData
         * @prop {string} name
         * @prop {string} bp 
         * @prop {string} bpUuid 
         * @prop {string} rp 
         * @prop {string} rpUuid 
         */

        /**
         * @type {Object<string,PackData>}
         */
        const allData = {}

        for (const location of root) {

            const bpDirectory = path.join(location, "development_behavior_packs")
            const rpDirectory = path.join(location, "development_resource_packs")

            const bpFiles = await fs.promises.readdir(bpDirectory, { withFileTypes: true })

            for (const bpFile of bpFiles) {
                if (bpFile.isDirectory()) {
                    options.push(bpFile.name)
                    const manifest = parse((await fs.promises.readFile(path.join(bpFile.path, bpFile.name, 'manifest.json'))).toString())
                    allData[bpFile.name] = { name: bpFile.name, bp: path.join(bpFile.path, bpFile.name), bpUuid: manifest?.header?.uuid || '', rp: '', rpUuid: manifest?.dependencies?.filter(x => Object.hasOwn(x, 'uuid'))[0]?.uuid || '' }
                }
            }

            const rpfiles = await fs.promises.readdir(rpDirectory, { withFileTypes: true })

            for (const rpFile of rpfiles) {
                if (rpFile.isDirectory()) {
                    const manifest = parse((await fs.promises.readFile(path.join(rpFile.path, rpFile.name, 'manifest.json'))).toString())
                    const match = Object.values(allData).filter(packData => packData.rpUuid === manifest?.header?.uuid)[0]
                    if (match) {
                        allData[match.name].rp = path.join(rpFile.path, rpFile.name)
                    }
                }
            }

        }

        if (options.length == 0) { vscode.window.showErrorMessage('No directories found'); return; }

        vscode.window.showQuickPick(options.sort()).then(async selectedOption => {
            if (selectedOption) {
                const workspaceFile = path.join(context.extensionPath, 'data/workspaces', selectedOption.replace(' [BP]', '').replace(' [RP]', '').toLowerCase() + '.code-workspace')
                if (fs.existsSync(workspaceFile)) vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspaceFile), false)
                else {
                    const data = {
                        folders: [
                            {
                                path: allData[selectedOption].bp.replace(/\\/g, '/')
                            }
                        ],
                        settings: {}
                    }
                    if (allData[selectedOption].rp) data.folders.push({ path: allData[selectedOption].rp.replace(/\\/g, '/') })
                    await fs.promises.writeFile(workspaceFile, JSON.stringify(data, null, 4))
                    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspaceFile), false)
                }
            }
        });
    } catch (error) {
        console.warn(error)
    }

}

module.exports = { projectSwitcher }