/**
* @typedef { 'bp_animation' |
* 'bp_animationcontroller' |
* 'block_culling_rule'|
* 'biome'|
* 'dimension'|
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
* 'feature_rule'|
* 'loot_table' |
* 'trade_table' |
* 'texture' |
* 'item_texture' |
* 'terrain_texture' |
* 'rp_entity'|
* 'function'|
* 'client_biome'|
* 'fog'|
* 'bp_manifest'|
* 'rp_manifest'|
* 'sounds'
* } FileType
*/

const { getBpPath, getRpPath } = require("./globalVars");
const path = require("path");

/**
 * @param {string} filePath 
 * @returns {FileType}
 */
function identifyFileType(filePath) {
    const bpPath = getBpPath()
    const rpPath = getRpPath()

    const workspace = filePath.startsWith(bpPath) ? bpPath : rpPath
    const folderName = path.relative(workspace, filePath).split('\\')[0]
    const fileName = path.basename(filePath)

    switch (fileName) {
        case 'item_texture.json': return 'item_texture'
        case 'terrain_texture.json': return 'terrain_texture'
        case 'sound_definitions.json': return 'sound_definition'
        case 'sounds.json': return 'sounds'
        case 'manifest.json': if (workspace == bpPath) return 'bp_manifest'; else return 'rp_manifest'
    }

    switch (folderName) {
        case 'items': return 'item'
        case 'entities': return 'entity'
        case 'entity': return 'rp_entity'
        case 'blocks': return 'block'
        case 'features': return 'feature'
        case 'feature_rules': return 'feature_rule'
        case 'loot_tables': return 'loot_table'
        case 'trade_tables': return 'trade_table'
        case 'structures': return 'structure'
        case 'scripts': return 'script'
        case 'dimensions': return 'dimension'
        case 'animations': if (workspace == bpPath) return 'bp_animation'; else return 'rp_animation'
        case 'animation_controllers': if (workspace == bpPath) return 'bp_animationcontroller'; else return 'rp_animationcontroller'
        case 'biomes': if (workspace == bpPath) return 'biome'; else return 'client_biome'
        case 'block_culling': return 'block_culling_rule'
        case 'fogs': return 'fog'
        case 'particles': return 'particle'
        case 'render_controllers': return 'rendercontroller'
        case 'models': return 'model'
        case 'sounds': return 'sound'
        case 'textures': return 'texture'
    }

    throw new Error(`Unable to identify type for ${folderName}`)
}

module.exports = { identifyFileType }