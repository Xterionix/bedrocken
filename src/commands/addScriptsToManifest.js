const { Form } = require('../sub/form');
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { parse } = require('jsonc-parser');
const { v4 } = require('uuid');

const scriptVersion = {
    "@minecraft/server": ["1.0.0", "1.1.0", "1.2.0", "1.3.0", "1.4.0", "1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.10.0", "1.11.0", "1.12.0", "1.13.0", "1.14.0", "1.15.0", "1.16.0", "1.17.0-beta"],
    "@minecraft/server-ui": ["1.0.0", "1.1.0", "1.2.0", "1.3.0", "1.4.0-beta"],
    "@minecraft/common": ["1.0.0", "1.1.0", "1.2.0"]
}

const moduleForm = new Form([{ type: 'checkbox', description: 'Choose script modules', label: 'Script Modules', options: ["@minecraft/server", "@minecraft/server-ui"] }]);

async function addScriptsToManifest(bpPath) {

    const manifestPath = path.join(bpPath, 'manifest.json')

    const manifest = parse((await fs.promises.readFile(manifestPath)).toString())

    const modules = manifest["modules"] || []
    let dependencies = manifest["dependencies"] || []

    if (modules.map(obj => obj.type).includes('script')) return;

    dependencies = dependencies.filter(obj => !obj.hasOwnProperty('module_name'))

    const versions = (await moduleForm.show())[0]

    if (!versions || !Array.isArray(versions)) return;

    for (const option of versions) {
        //TODO: Cache the form?
        const version = await vscode.window.showQuickPick(scriptVersion[option].slice().reverse(), { title: option });
        dependencies.push({ "module_name": option, "version": version });
    }

    modules.push(
        {
            "type": "script",
            "language": "javascript",
            "version": [
                1,
                0,
                0
            ],
            "entry": "scripts/index.js",
            "uuid": v4()
        }
    )

    manifest["modules"] = modules
    manifest["dependencies"] = dependencies
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 4))

    vscode.window.showInformationMessage("Scripts added to `manifest.json`")
    vscode.commands.executeCommand("setContext", 'bedrocken.can_add_scripts', false)

}

module.exports = { addScriptsToManifest }