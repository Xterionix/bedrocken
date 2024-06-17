const path = require('path')
const fs = require('fs')
const { parse } = require('jsonc-parser')

class CacheSystem {

    #cache = {
        entity: {
            ids: [],
            spawnable_ids: [],
            rideable_ids: []
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
            items: [],
            terrain: []
        },
        structures: []
    }

    /** * @typedef {'entity'|'item'|'block'|'script'|'structure'|'item_texture'|'terrain_texture'} FileType */

    getCache() {
        return this.#cache
    }

    /**
     * @param {string} folderPath 
     * @param {FileType} type
     */
    async processDirectory(folderPath, type) {
        if (!fs.existsSync(folderPath)) return;

        const files = getAllFilePaths(folderPath);

        for (const file of files) {
            await this.processFile(file, type);
        }
    }

    /**
     * @param {string} file 
     * @param {FileType} type
     */
    async processFile(file, type) {

        if (!fs.existsSync(file)) return;

        try {

            const text = (await fs.promises.readFile(file)).toString()
            const json = parse(text)
            const fileName = path.basename(file)

            switch (type) {
                case 'entity': this.processEntityFile(text, json)
                    break;
                case 'item': this.proceessItemFile(json)
                    break;
                case 'block': this.processBlockFile(json)
                    break;
                case 'script': this.processScriptFile(text)
                    break;
                case 'structure': this.processStructureFile(fileName)
                    break;
                case 'item_texture': this.processItemTextures(json)
                    break;
                case 'terrain_texture': this.processTerrainTextures(json)
                    break;
                default: console.warn(`Unknown file type: ${type}`)
                    break;
            }

        } catch (error) {
            console.warn(`Failed to process ${path.basename(file)} -> ${error}`)
        }

    }

    processStructureFile(name) {
        this.#cache.structures.push('mystructure:' + name.split('.')[0])
    }
    processItemTextures(json) {
        this.#cache.textures.items = Object.keys(json["texture_data"]).sort()
    }
    processTerrainTextures(json) {
        this.#cache.textures.terrain = Object.keys(json["texture_data"]).sort()
    }
    processEntityFile(text, json) {
        const description = json["minecraft:entity"]?.["description"]
        if (!description || !description["identifier"]) return;
        const identifier = description["identifier"]
        if (identifier.includes('minecraft:')) return;
        this.#cache.entity.ids.push(identifier)
        if (text.includes('minecraft:rideable')) this.#cache.entity.rideable_ids.push(identifier)
        if (description["is_spawnable"]) this.#cache.entity.spawnable_ids.push(identifier)
    }
    proceessItemFile(json) {
        const identifier = json["minecraft:item"]["description"]["identifier"]
        if (identifier) this.#cache.item.ids.push(identifier)
    }
    processBlockFile(json) {
        const identifier = json["minecraft:block"]["description"]["identifier"]
        if (identifier) this.#cache.block.ids.push(identifier)
    }
    processScriptFile(text) {
        (text.match(/(?:blockComponentRegistry|event\.blockTypeRegistry|blockTypeRegistry)\.registerCustomComponent\(['"]([^'"]*)['"]/g) || []).forEach(match => {
            this.#cache.block.custom_components.push(match.match(/['"]([^'"]*)['"]/)[1]);
        });
        (text.match(/(?:itemComponentRegistry|event\.itemTypeRegistry|itemTypeRegistry)\.registerCustomComponent\(['"]([^'"]*)['"]/g) || []).forEach(match => {
            this.#cache.item.custom_components.push(match.match(/['"]([^'"]*)['"]/)[1]);
        });
    }


}

function getAllFilePaths(folderPath) {
    let filePaths = [];

    function readFolder(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        entries.forEach(entry => {
            const entryPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                readFolder(entryPath); // Recursively read subfolders
            } else if (entry.isFile()) {
                filePaths.push(entryPath); // Collect file paths
            }
        });
    }

    readFolder(folderPath);
    return filePaths;
}

module.exports = { CacheSystem, getAllFilePaths }