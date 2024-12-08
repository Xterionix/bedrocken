const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { parse } = require('jsonc-parser');


async function linkManifests(bpPath, rpPath) {

    if (!bpPath) { vscode.window.showErrorMessage('No behavior pack found'); return; }
    if (!rpPath) { vscode.window.showErrorMessage('No resource pack found'); return; }

    const bpManifestPath = path.join(bpPath, 'manifest.json')
    const rpManifestPath = path.join(rpPath, 'manifest.json')

    const bpManifest = parse((await fs.promises.readFile(bpManifestPath)).toString())
    const rpManifest = parse((await fs.promises.readFile(rpManifestPath)).toString())

    const bpDepen = (bpManifest["dependencies"] || []).filter(obj => !(obj.version instanceof Array))
    const rpDepen = (rpManifest["dependencies"] || []).filter(obj => !(obj.version instanceof Array))

    bpDepen.push({ "uuid": rpManifest["header"]["uuid"], "version": [1, 0, 0] })
    rpDepen.push({ "uuid": bpManifest["header"]["uuid"], "version": [1, 0, 0] })

    bpManifest["dependencies"] = bpDepen
    rpManifest["dependencies"] = rpDepen

    await fs.promises.writeFile(bpManifestPath, JSON.stringify(bpManifest, null, 4))
    await fs.promises.writeFile(rpManifestPath, JSON.stringify(rpManifest, null, 4))

    vscode.window.showInformationMessage("Manifests linked successfully!")
    vscode.commands.executeCommand("setContext", 'bedrocken.can_link_manifests', false)

}

module.exports = { linkManifests }