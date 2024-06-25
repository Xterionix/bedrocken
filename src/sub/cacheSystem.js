const path = require('path')
const fs = require('fs')
const { glob } = require('glob');
const { parse } = require('jsonc-parser')
const { exists } = require('./util');

class CacheSystem {

    #cache = {
        bp_animations: [],
        bp_animationcontrollers: [],
        block_culling_rules: [],
        rp_animations: [],
        rp_animationcontrollers: [],
        sound_definitions: [],
        sounds: [],
        models: [],
        particles: [],
        rendercontrollers: [],
        entity: {
            ids: [],
            spawnable_ids: [],
            rideable_ids: [],
            boolean_properties: [],
            integer_properties: [],
            float_properties: [],
            enum_properties: []
        },
        item: {
            ids: [],
            custom_components: []
        },
        block: {
            ids: [],
            custom_components: []
        },
        textures: {
            paths: [],
            items: [],
            terrain: []
        },
        structures: [],
        features: [],
        loot_tables: [],
        trade_tables: []
    }

    /**
 * @typedef { 'bp_animation' |
    * 'bp_animationcontroller' |
    * 'block_culling_rule'|
    * 'rp_animation'|
    * 'rp_animationcontroller'|
    * 'sound_definition'|
    * 'sound'|
    * 'entity' |
    * 'item' |
    * 'model' |
    * 'particle' |
    * 'rendercontroller' |
    * 'block' |
    * 'script' |
    * 'structure' |
    * 'feature' |
    * 'loot_table' |
    * 'trade_table' |
    * 'texture' |
    * 'item_texture' |
    * 'terrain_texture'
    * } FileType
    */

    getCache() {
        return this.#cache
    }

    /**
     * @param {string} folderPath 
     * @param {FileType} type
     */
    async processDirectory(folderPath, type) {
        if (!(await exists(folderPath))) return;

        const files = await getAllFilePaths(folderPath);

        for (const file of files) {
            await this.processFile(file, type);
        }
    }

    /**
     * @param {FileType} type
     * @param {string} pattern
     */
    async processGlob(folderPath, pattern, type) {

        const files = await glob.glob(pattern, { cwd: folderPath })

        switch (type) {
            case 'loot_table': this.#cache.loot_tables = files.map(x => x.replace(/\\/g, '/'))
                break;
            case 'trade_table': this.#cache.trade_tables = files.map(x => x.replace(/\\/g, '/'))
                break;
            case 'sound': this.#cache.sounds = files.map(x => x.replace(/\\/g, '/').replace(new RegExp(path.extname(x), 'g'), ''))
                break;
            case 'texture': this.#cache.textures.paths = files.map(x => x.replace(/\\/g, '/').replace(new RegExp(path.extname(x), 'g'), ''))
                break;
            default: console.warn(`Unknown file type: ${type}`)
                break;
        }

    }

    /**
     * @param {string} file 
     * @param {FileType} type
     */
    async processFile(file, type) {

        if (!(await exists(file))) return;

        try {

            const text = (await fs.promises.readFile(file)).toString()
            const json = parse(text)
            const fileName = path.basename(file)

            switch (type) {
                case 'entity': this.#processEntityFile(text, json)
                    break;
                case 'item': this.#proceessItemFile(json)
                    break;
                case 'block': this.#processBlockFile(json)
                    break;
                case 'feature': this.#processFeaturefile(json)
                    break;
                case 'script': this.#processScriptFile(text)
                    break;
                case 'structure': this.#processStructureFile(fileName)
                    break;
                case 'bp_animation': this.#processBpAnimationfile(json)
                    break;
                case 'bp_animationcontroller': this.#processBpAnimationControllerfile(json)
                    break;
                case 'rp_animation': this.#processRpAnimationfile(json)
                    break;
                case 'rp_animationcontroller': this.#processRpAnimationControllerfile(json)
                    break;
                case 'block_culling_rule': this.#processBlockCullingRule(json)
                    break;
                case 'particle': this.#processParticle(json)
                    break;
                case 'rendercontroller': this.#processRenderController(json)
                    break;
                case 'model': this.#processModel(text)
                    break;
                case 'item_texture': this.#processItemTextures(json)
                    break;
                case 'terrain_texture': this.#processTerrainTextures(json)
                    break;
                case 'sound_definition': this.#processSoundDefinitions(json)
                    break;
                default: console.warn(`Unknown file type: ${type}`)
                    break;
            }

        } catch (error) {
            console.warn(`Failed to process ${path.basename(file)} -> ${error}`)
        }

    }

    resetEntityCache() {
        this.#cache.entity = {
            ids: [],
            spawnable_ids: [],
            rideable_ids: [],
            boolean_properties: [],
            integer_properties: [],
            float_properties: [],
            enum_properties: []
        }
    }

    #processParticle(json) {
        const identifier = json["particle_effect"]["description"]["identifier"]
        if (identifier) this.#cache.particles.push(identifier)
    }
    #processRenderController(json) {
        this.#cache.rendercontrollers.push(...Object.keys(json["render_controllers"]).sort())
    }
    #processModel(text) {
        this.#cache.models.push(...text.match(/"geometry\.([^"]*)"/g).map(x => x.slice(1, -1)))
    }
    #processSoundDefinitions(json) {
        this.#cache.sound_definitions = Object.keys(json["sound_definitions"]).sort()
    }
    #processBlockCullingRule(json) {
        const identifier = json["minecraft:block_culling_rules"]["description"]["identifier"]
        if (identifier) this.#cache.block_culling_rules.push(identifier)
    }
    #processBpAnimationfile(json) {
        this.#cache.bp_animations.push(...Object.keys(json["animations"]).sort())
    }
    #processBpAnimationControllerfile(json) {
        this.#cache.bp_animationcontrollers.push(...Object.keys(json["animation_controllers"]).sort())
    }
    #processRpAnimationfile(json) {
        this.#cache.rp_animations.push(...Object.keys(json["animations"]).sort())
    }
    #processRpAnimationControllerfile(json) {
        this.#cache.rp_animationcontrollers.push(...Object.keys(json["animation_controllers"]).sort())
    }
    #processFeaturefile(json) {
        const identifier = json["minecraft:weighted_random_feature"]?.["description"]?.["identifier"] || json["minecraft:aggregate_feature"]?.["description"]?.["identifier"] || json["minecraft:cave_carver_feature"]?.["description"]?.["identifier"] || json["minecraft:fossil_feature"]?.["description"]?.["identifier"] || json["minecraft:geode_feature"]?.["description"]?.["identifier"] || json["minecraft:growing_plant_feature"]?.["description"]?.["identifier"] || json["minecraft:multiface_feature"]?.["description"]?.["identifier"] || json["minecraft:nether_cave_carver_feature"]?.["description"]?.["identifier"] || json["minecraft:ore_feature"]?.["description"]?.["identifier"] || json["minecraft:partially_exposed_blob_feature"]?.["description"]?.["identifier"] || json["minecraft:scatter_feature"]?.["description"]?.["identifier"] || json["minecraft:search_feature"]?.["description"]?.["identifier"] || json["minecraft:sequence_feature"]?.["description"]?.["identifier"] || json["minecraft:single_block_feature"]?.["description"]?.["identifier"] || json["minecraft:snap_to_surface_feature"]?.["description"]?.["identifier"] || json["minecraft:structure_template_feature"]?.["description"]?.["identifier"] || json["minecraft:surface_relative_threshold_feature"]?.["description"]?.["identifier"] || json["minecraft:tree_feature"]?.["description"]?.["identifier"] || json["minecraft:underwater_cave_carver_feature"]?.["description"]?.["identifier"] || json["minecraft:vegetation_patch_feature"]?.["description"]?.["identifier"]
        if (!identifier || identifier.includes('minecraft:')) return;
        this.#cache.features.push(identifier)
    }
    #processStructureFile(name) {
        this.#cache.structures.push('mystructure:' + name.split('.')[0])
    }
    #processItemTextures(json) {
        this.#cache.textures.items = Object.keys(json["texture_data"]).sort()
    }
    #processTerrainTextures(json) {
        this.#cache.textures.terrain = Object.keys(json["texture_data"]).sort()
    }
    #processEntityFile(text, json) {
        const description = json["minecraft:entity"]?.["description"]
        if (!description || !description["identifier"]) return;
        const identifier = description["identifier"]
        if (identifier.includes('minecraft:')) return;
        this.#cache.entity.ids.push(identifier)
        if (text.includes('minecraft:rideable')) this.#cache.entity.rideable_ids.push(identifier)
        if (description["is_spawnable"]) this.#cache.entity.spawnable_ids.push(identifier)
        if (!description["properties"]) return;
        const properties = description["properties"]
        for (const property in properties) {
            const type = properties[property]['type']
            switch (type) {
                case 'bool': this.#cache.entity.boolean_properties.push(property)
                    break;
                case 'int': this.#cache.entity.integer_properties.push(property)
                    break;
                case 'float': this.#cache.entity.float_properties.push(property)
                    break;
                case 'enum': this.#cache.entity.enum_properties.push({ id: property, value: properties[property]['values'] || [] })
                    break;
            }
        }
    }
    #proceessItemFile(json) {
        const identifier = json["minecraft:item"]["description"]["identifier"]
        if (identifier) this.#cache.item.ids.push(identifier)
    }
    #processBlockFile(json) {
        const identifier = json["minecraft:block"]["description"]["identifier"]
        if (identifier) this.#cache.block.ids.push(identifier)
    }
    #processScriptFile(text) {
        (text.match(/(?:blockComponentRegistry|event\.blockTypeRegistry|blockTypeRegistry)\.registerCustomComponent\(['"]([^'"]*)['"]/g) || []).forEach(match => {
            this.#cache.block.custom_components.push(match.match(/['"]([^'"]*)['"]/)[1]);
        });
        (text.match(/(?:itemComponentRegistry|event\.itemTypeRegistry|itemTypeRegistry)\.registerCustomComponent\(['"]([^'"]*)['"]/g) || []).forEach(match => {
            this.#cache.item.custom_components.push(match.match(/['"]([^'"]*)['"]/)[1]);
        });
    }


}

async function getAllFilePaths(folderPath) {
    let filePaths = [];

    async function readFolder(currentPath) {

        const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                await readFolder(entryPath); // Recursively read subfolders
            } else if (entry.isFile()) {
                filePaths.push(entryPath); // Collect file paths
            }
        }

    }

    await readFolder(folderPath);
    return filePaths;
}

module.exports = { CacheSystem, getAllFilePaths }