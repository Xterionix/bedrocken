const { CacheSystem } = require('./cacheSystem');

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { parse } = require('jsonc-parser');

class Filewatcher {

    /**
     * 
     * @param {CacheSystem} system 
     * @param {string} bpPath 
     * @param {string|undefined} rpPath 
     */
    constructor(system, bpPath, rpPath) {
        this.system = system;
        this.bpPath = bpPath;
        this.rpPath = rpPath;

        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{js,json,mcstructure,mcfunction,png,jpg,jpeg,tga}', false, false, false);
        this.watcher.onDidChange(this.#updateCache.bind(this));
        this.watcher.onDidCreate(this.#updateCache.bind(this));
        this.watcher.onDidDelete(this.#updateCache.bind(this));
    }

    dispose() {
        this.watcher.dispose()
    }

    async #updateCache(e) {

        if (e.fsPath.includes(' copy.json')) return;

        const workspace = e.fsPath.startsWith(this.bpPath) ? this.bpPath : this.rpPath
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
            case 'scripts':
                this.system.getCache().block.custom_components = []; this.system.getCache().item.custom_components = []; this.system.getCache().texts = [];
                this.system.processDirectory(readPath, 'script');
                break;
            case 'animations':
                if (readPath.startsWith(this.bpPath)) { this.system.getCache().bp_animations = []; this.system.processDirectory(readPath, 'bp_animation') }
                else { this.system.getCache().rp_animations = []; this.system.processDirectory(readPath, 'rp_animation') }
                break;
            case 'animation_controllers':
                if (readPath.startsWith(this.bpPath)) { this.system.getCache().bp_animationcontrollers = []; this.system.processDirectory(readPath, 'bp_animationcontroller') }
                else { this.system.getCache().rp_animationcontrollers = []; this.system.processDirectory(readPath, 'rp_animationcontroller') }
                break;
            case 'block_culling': this.system.getCache().block_culling_rules = []; this.system.processDirectory(readPath, 'block_culling_rule')
                break;
            case 'particles': this.system.getCache().particles = []; this.system.processDirectory(readPath, 'particle')
                break;
            case 'render_controllers': this.system.getCache().rendercontrollers = []; this.system.processDirectory(readPath, 'rendercontroller')
                break;
            case 'models': this.system.getCache().models = []; this.system.processDirectory(readPath, 'model')
                break;
            case 'sounds': this.system.getCache().sounds = []; this.system.processGlob(this.rpPath, 'sounds/**/*.{ogg,wav,mp3,fsb}', 'sound')
                break;
            case 'textures': this.system.getCache().textures.paths = []; this.system.processGlob(this.rpPath, 'textures/**/*.{png,jpg,jpeg,tga}', 'texture');
                break;
            default:
                console.warn(`No cache to update for ${folderName}`)
        }

        switch (fileName) {
            case 'item_texture.json': this.system.getCache().textures.items = []; this.system.processFile(path.join(this.rpPath, 'textures/item_texture.json'), 'item_texture')
                break;
            case 'terrain_texture.json': this.system.getCache().textures.terrain = []; this.system.processFile(path.join(this.rpPath, 'textures/terrain_texture.json'), 'terrain_texture')
                break;
            case 'sound_definitions.json': this.system.getCache().sound_definitions = []; this.system.processFile(path.join(this.rpPath, 'sounds/sound_definitions.json'), 'sound_definition')
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