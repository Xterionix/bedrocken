const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { v4 } = require('uuid');

const mojangFolder = process.env.APPDATA.replace('Roaming', '') + '//Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang'

async function createNewProject(context) {

    const bpName = await vscode.window.showInputBox({ prompt: 'Enter Behavior Pack name', placeHolder: 'Addon #424 [BP]' })
    const bpDescription = (await vscode.window.showInputBox({ prompt: 'Enter Behavior Pack description', placeHolder: 'Another new addon!' })) || ''

    const rpName = (await vscode.window.showInputBox({ prompt: 'Enter Resource Pack name', placeHolder: 'Addon #424 [RP]' })) || ''
    const rpDescription = (await vscode.window.showInputBox({ prompt: 'Enter Resource Pack description', placeHolder: 'Another new addon!' })) || bpDescription

    if (!bpName) return;

    const bpUuid = v4();
    const bpPath = path.join(mojangFolder, 'development_behavior_packs', bpName)
    const rpUuid = v4();
    const rpPath = path.join(mojangFolder, 'development_resource_packs', rpName)

    const manifest = {
        "format_version": 2,
        "header": {
            "description": bpDescription,
            "name": bpName,
            "uuid": bpUuid,
            "min_engine_version": [
                1,
                20,
                80
            ],
            "version": [
                1,
                0,
                0
            ]
        },
        "modules": [
            {
                "type": "data",
                "uuid": v4(),
                "version": [
                    1,
                    0,
                    0
                ]
            }
        ]
    }

    const data = {
        folders: [
            {
                path: bpPath
            }
        ],
        settings: {}
    }

    if (rpName) manifest["dependencies"] = [
        {
            "uuid": rpUuid,
            "version": [
                1,
                0,
                0
            ]
        }
    ]

    await fs.promises.mkdir(bpPath, { recursive: true });
    await fs.promises.writeFile(path.join(bpPath, 'manifest.json'), JSON.stringify(manifest, null, 4))

    if (rpName) {

        manifest["header"]["name"] = rpName;
        manifest["header"]["description"] = rpDescription;
        manifest["header"]["uuid"] = rpUuid;
        manifest["modules"][0]["type"] = "resources";
        manifest["dependencies"] = [
            {
                "uuid": bpUuid,
                "version": [
                    1,
                    0,
                    0
                ]
            }
        ]

        await fs.promises.mkdir(rpPath, { recursive: true })
        await fs.promises.writeFile(path.join(rpPath, 'manifest.json'), JSON.stringify(manifest, null, 4))
        data.folders.push({ path: rpPath })

    }

    const workspaceFile = path.join(context.extensionPath, 'data/workspaces', bpName.replace(' [BP]', '').replace(' [RP]', '').toLowerCase() + '.code-workspace')

    await fs.promises.writeFile(workspaceFile, JSON.stringify(data, null, 4))
    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspaceFile), false)

}

module.exports = { createNewProject }