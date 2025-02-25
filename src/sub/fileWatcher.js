const { CacheSystem } = require('./cacheSystem');
const { identifyFileType } = require('./fileType')

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
        const fileType = identifyFileType(e.fsPath);

        switch (fileType) {
            case 'item': this.system.getCache().item.ids = []; this.system.processDirectory(readPath, 'item');
                break;
            case 'entity': this.system.resetEntityCache(); this.system.processDirectory(readPath, 'entity');
                break;
            case 'block': this.system.getCache().block.ids = []; this.system.processDirectory(readPath, 'block');
                break;
            case 'feature': this.system.getCache().features = []; this.system.processDirectory(readPath, 'feature')
                break;
            case 'function': this.system.getCache().functions = []; this.system.processGlob(this.bpPath, 'functions/**/*.mcfunction', 'function')
                break;
            case 'loot_table': this.system.getCache().loot_tables = []; this.system.processGlob(this.bpPath, 'loot_tables/**/*.json', 'loot_table');
                break;
            case 'trade_table': this.system.getCache().trade_tables = []; this.system.processGlob(this.bpPath, 'trade_tables/**/*.json', 'trade_table');
                break;
            case 'structure': this.system.getCache().structures = []; this.system.processDirectory(readPath, 'structure')
                break;
            case 'script':
                this.system.getCache().block.custom_components = []; this.system.getCache().item.custom_components = []; this.system.getCache().texts = [];
                this.system.processDirectory(readPath, 'script');
                break;
            case 'bp_animation': this.system.getCache().bp_animations = []; this.system.processDirectory(readPath, 'bp_animation')
                break;
            case 'rp_animation': this.system.getCache().rp_animations = []; this.system.processDirectory(readPath, 'rp_animation')
                break;
            case 'bp_animationcontroller': this.system.getCache().bp_animationcontrollers = []; this.system.processDirectory(readPath, 'bp_animationcontroller')
                break;
            case 'rp_animationcontroller': this.system.getCache().rp_animationcontrollers = []; this.system.processDirectory(readPath, 'rp_animationcontroller')
                break;
            case 'block_culling_rule': this.system.getCache().block_culling_rules = []; this.system.processDirectory(readPath, 'block_culling_rule')
                break;
            case 'fog': this.system.getCache().fogs = []; this.system.processDirectory(readPath, 'fog')
                break;
            case 'particle': this.system.getCache().particles = []; this.system.processDirectory(readPath, 'particle')
                break;
            case 'rendercontroller': this.system.getCache().rendercontrollers = []; this.system.processDirectory(readPath, 'rendercontroller')
                break;
            case 'model': this.system.getCache().models = []; this.system.processDirectory(readPath, 'model')
                break;
            case 'sound': this.system.getCache().sounds = []; this.system.processGlob(this.rpPath, 'sounds/**/*.{ogg,wav,mp3,fsb}', 'sound')
                break;
            case 'texture': this.system.getCache().textures.paths = []; this.system.processGlob(this.rpPath, 'textures/**/*.{png,jpg,jpeg,tga}', 'texture');
                break;
            case 'item_texture': this.system.getCache().textures.items = []; this.system.processFile(path.join(this.rpPath, 'textures/item_texture.json'), 'item_texture')
                break;
            case 'terrain_texture': this.system.getCache().textures.terrain = []; this.system.processFile(path.join(this.rpPath, 'textures/terrain_texture.json'), 'terrain_texture')
                break;
            case 'sound_definition': this.system.getCache().sound_definitions = []; this.system.processFile(path.join(this.rpPath, 'sounds/sound_definitions.json'), 'sound_definition')
                break;
            case 'item_catalog': this.system.getCache().groups = []; this.system.processFile(readPath, 'item_catalog');
                break;
            case 'sounds': this.system.getCache().block_sounds = []; this.system.processFile(readPath, 'sounds');
                break;
            case 'bp_manifest':
                const manifest = parse((await fs.promises.readFile(path.join(this.bpPath, 'manifest.json'))).toString())
                vscode.commands.executeCommand('setContext', 'bedrocken.can_add_scripts', !manifest["modules"]?.map(obj => obj.type).includes('script'))
                vscode.commands.executeCommand('setContext', 'bedrocken.can_link_manifests', !manifest["dependencies"]?.map(obj => obj.version instanceof Array).includes(true))
                break;
        }

    }

}

module.exports = { Filewatcher }