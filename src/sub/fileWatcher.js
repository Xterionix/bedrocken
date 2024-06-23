const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { parse } = require('jsonc-parser');

class Filewatcher {

    constructor(system, bpPath, rpPath) {
        this.system = system;
        this.bpPath = bpPath;
        this.rpPath = rpPath;

        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{json,mcstructure}', false, false, false);
        this.watcher.onDidChange(this.#updateCache.bind(this));
        this.watcher.onDidCreate(this.#updateCache.bind(this));
        this.watcher.onDidDelete(this.#updateCache.bind(this));
    }

    dispose() {
        this.watcher.dispose()
    }

    async #updateCache(e) {

        if (e.fsPath.includes(' copy.json')) return;

        const workspace = vscode.workspace.workspaceFolders.find(folder => e.fsPath.startsWith(folder.uri.fsPath)).index == 0 ? this.bpPath : this.rpPath
        const folderName = path.relative(workspace, e.fsPath).split('\\')[0]
        const readPath = path.join(workspace, folderName)
        const fileName = path.basename(e.fsPath)

        switch (folderName) {
            case 'items': this.system.getCache().item.ids = []; this.system.processDirectory(readPath, 'item');
                break;
            case 'entities': this.system.resetEntityCache(); this.system.processDirectory(readPath, 'entity');
                break;
            case 'blocks': this.system.getCache().block.ids = []; this.system.processDirectory(readPath, 'block');
                break;
            case 'features': this.system.getCache().features = []; this.system.processDirectory(readPath, 'feature')
                break;
            case 'loot_tables': this.system.getCache().loot_tables = []; this.system.processGlob(this.bpPath, 'loot_tables/**/*.json', 'loot_table');
                break;
            case 'trade_tables': this.system.getCache().trade_tables = []; this.system.processGlob(this.bpPath, 'trade_tables/**/*.json', 'trade_table');
                break;
            case 'structures': this.system.getCache().structures = []; this.system.processDirectory(readPath, 'structure')
                break;
            case 'scripts': this.system.getCache().block.custom_components = []; this.system.getCache().item.custom_components = []; this.system.processDirectory(readPath, 'script');
                break;
        }

        switch (fileName) {
            case 'item_texture.json': this.system.getCache().textures.items = []; this.system.processFile(path.join(this.rpPath, 'textures/item_texture.json'), 'item_texture')
                break;
            case 'terrain_texture.json': this.system.getCache().textures.terrain = []; this.system.processFile(path.join(this.rpPath, 'textures/terrain_texture.json'), 'terrain_texture')
                break;
            case 'manifest.json': if (workspace != this.bpPath) return;
                const manifest = parse((await fs.promises.readFile(path.join(this.bpPath, 'manifest.json'))).toString())
                vscode.commands.executeCommand('setContext', 'bedrocken.can_add_scripts', !manifest["modules"]?.map(obj => obj.type).includes('script'))
                vscode.commands.executeCommand('setContext', 'bedrocken.can_link_manifests', !manifest["dependencies"]?.map(obj => obj.version instanceof Array).includes(true))
                break;
        }

    }

}

module.exports = { Filewatcher }