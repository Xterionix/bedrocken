const { CacheSystem } = require('../sub/cacheSystem');

const path = require('path');
const vscode = require('vscode');
const { parse, getLocation, visit } = require('jsonc-parser');

//TODO: Tree feature

/**
 * @param {CacheSystem} system
 */
function createJsonProvider(system) {

    return vscode.languages.registerCompletionItemProvider(
        [
            { scheme: 'file', language: 'json' },
            { scheme: 'file', language: 'jsonc' }
        ], {
        provideCompletionItems(document, position) {

            const suggestions = [];
            const prefix = vscode.workspace.getConfiguration('bedrocken').get('project_prefix', 'bedrocken');
            const fileBasedIdentifier = prefix + ':' + path.basename(document.fileName).replace('.json', '');

            const allItems = system.getCache().item.ids.concat(system.getCache().block.ids).concat(system.getVanillaData().item.ids)
            const allBlocks = system.getCache().block.ids.concat(system.getVanillaData().block.ids)
            const allEntities = system.getCache().entity.ids.concat(system.getVanillaData().entity.ids)

            let jsonPath = getLocation(document.getText(), document.offsetAt(position)).path.filter(x => typeof x != 'number')
                .join('[|]')
                .replace('minecraft:icon[|]textures[|]default', 'minecraft:icon')
                .replace('permutations[|]', '')
                .replace(/minecraft:material_instances\[[^\]]*\]([^[]*)texture/, 'minecraft:material_instances[|]*[|]texture')
                .replace(/_groups\[\|\][a-zA-Z0-9$!_]+/g, 's')
                .replace(/(?<=minecraft:entity).*?(?=filters)/g, '[|]')
                .replace(/\[\|\](all_of|any_of|none_of)/g, '')
                .replace(/(?<=description\[\|\]animations).*/g, '')
                .replace(/(?<=description\[\|\]geometry).*/g, '')
                .replace(/(?<=description\[\|\]particle_effects).*/g, '')
                .replace(/(?<=description\[\|\]textures).*/g, '')
                .replace(/(?<=description\[\|\]scripts\[\|\]animate).*/g, '')
                .replace(/(?<=description\[\|\]sound_effects).*/g, '')
                .replace(/(?<=entity_sounds\[\|\]entities\[\|\]).*?(?=events)/g, '')
                .replace(/(?<=entity_sounds\[\|\]entities\[\|\]events).*/g, '')
                .replace(/(?<=sound_definitions\[\|\]).*?(?=sounds)/g, '')
                .replace(/(?<=texture_data\[\|\]).*?(?=textures)/g, '')
                .replace(/(?<=recipe_shaped\[\|]key).*?(?=\[\|]item|$)/g, '')
                .replace(/(?<=recipe_shaped\[\|\])key$.*/g, 'key[|]property')
                .replace('entity_sounds[|]entities[|]events', 'entity_sounds[|]entities[|]events[|]sound')
                .replace(/minecraft:geometry$/gm, 'minecraft:geometry[|]identifier')
                .replace(/(?<=animation_controllers\[\|]).*?(?=states)/g, '')
                .replace(/(?<=states\[\|]).*?(?=transitions)/g, '')
                .replace(/(?<=states\[\|\]transitions).*/g, '')
                .replace(/(?<=single_block_feature\[\|\]may_attach_to).*/g, '')
                .split('[|]')

            let value = [];
            let inQuotes = false;

            visit(document.getText(), {
                onLiteralValue: (value, offset, length) => inQuotes = !inQuotes ? isInQuotes(value, offset, length, document, position) : true,
                onObjectProperty: (value, offset, length) => inQuotes = !inQuotes ? isInQuotes(value, offset, length, document, position) : true
            });

            if (!inQuotes) return;

            const jsonInDoc = parse(document.getText())
            const actualPath = getLocation(document.getText(), document.offsetAt(position)).path
            const actualValueInDoc = valueFromJsonPath(actualPath, jsonInDoc)

            if (jsonPath.includes('minecraft:entity') && jsonPath.includes('filters')) {
                const testPath = actualPath.slice(0, -1)
                testPath.push("test")
                const test = valueFromJsonPath(testPath, jsonInDoc)
                if (!test) return;
                jsonPath.push(test)
            }

            const dynamicAutocomplete = {
                "minecraft:entity": {
                    description: {
                        identifier: fileBasedIdentifier,
                        animations: system.getCache().bp_animations.concat(system.getCache().bp_animationcontrollers),
                        scripts: {
                            animate: system.getCache().entity.animations.filter(x => (jsonInDoc["minecraft:entity"]?.["description"]?.["animations"] ? Object.keys(jsonInDoc["minecraft:entity"]["description"]["animations"]) : []).includes(x))
                        }
                    },
                    components: {
                        'minecraft:loot': {
                            table: system.getCache().loot_tables.filter(x => x.startsWith('loot_tables/entities'))
                        },
                        'minecraft:trade_table': {
                            table: system.getCache().trade_tables
                        }
                    },
                    filters: {
                        value: {
                            enum_property: system.getCache().entity.enum_properties.filter(x => x.id == valueFromJsonPath(getLocation(document.getText(), document.offsetAt(position)).path.slice(0, -1).concat(["domain"]), jsonInDoc))[0]?.value,
                            bool_property: [true, false]
                        },
                        domain: {
                            bool_property: system.getCache().entity.boolean_properties,
                            int_property: system.getCache().entity.integer_properties,
                            float_property: system.getCache().entity.float_properties,
                            enum_property: system.getCache().entity.enum_properties.map(x => x.id)
                        }
                    }
                },
                "minecraft:client_entity": {
                    description: {
                        identifier: system.getCache().entity.ids,
                        animations: system.getCache().rp_animations.concat(system.getCache().rp_animationcontrollers),
                        geometry: system.getCache().models,
                        sound_effects: system.getCache().sound_definitions,
                        particle_effects: system.getCache().particles,
                        textures: system.getCache().textures.paths,
                        render_controllers: system.getCache().rendercontrollers,
                        spawn_egg: {
                            texture: system.getCache().textures.items
                        },
                        scripts: {
                            animate: (jsonInDoc["minecraft:client_entity"]?.["description"]?.["animations"] ? Object.keys(jsonInDoc["minecraft:client_entity"]["description"]["animations"]) : [])
                        }
                    }
                },
                "minecraft:attachable": {
                    description: {
                        identifier: system.getCache().item.ids,
                        animations: system.getCache().rp_animations.concat(system.getCache().rp_animationcontrollers),
                        geometry: system.getCache().models,
                        sound_effects: system.getCache().sound_definitions,
                        particle_effects: system.getCache().particles,
                        textures: system.getCache().textures.paths,
                        render_controllers: system.getCache().rendercontrollers,
                        scripts: {
                            animate: (jsonInDoc["minecraft:client_entity"]?.["description"]?.["animations"] ? Object.keys(jsonInDoc["minecraft:client_entity"]["description"]["animations"]) : [])
                        }
                    }
                },
                "minecraft:spawn_rules": {
                    description: {
                        identifier: system.getCache().entity.ids
                    }
                },
                "minecraft:item": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    components: {
                        "minecraft:custom_components": system.getCache().item.custom_components,
                        "minecraft:icon": system.getCache().textures.items,
                        "minecraft:block_placer": {
                            block: allBlocks,
                            use_on: allBlocks
                        },
                        "minecraft:digger": {
                            destroy_speeds: {
                                block: allBlocks
                            }
                        },
                        "minecraft:entity_placer": {
                            entity: allEntities,
                            use_on: allBlocks,
                            dispense_on: allBlocks
                        },
                        "minecraft:food": {
                            using_converts_to: allItems
                        },
                        "minecraft:projectile": {
                            projectile_entity: allEntities
                        },
                        "minecraft:repairable": {
                            repair_items: {
                                items: allItems
                            }
                        },
                        "minecraft:shooter": {
                            ammunition: {
                                item: allItems
                            }
                        }
                    }
                },
                "minecraft:block": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    components: {
                        "minecraft:custom_components": system.getCache().block.custom_components,
                        "minecraft:material_instances": {
                            "*": {
                                texture: system.getCache().textures.terrain
                            }
                        },
                        'minecraft:geometry': {
                            identifier: system.getCache().models,
                            culling: system.getCache().block_culling_rules
                        },
                        "minecraft:loot": system.getCache().loot_tables.filter(x => x.startsWith('loot_tables/block')),
                        "minecraft:placement_filter": {
                            conditions: {
                                block_filter: allBlocks
                            }
                        }
                    }
                },
                "minecraft:feature_rules": {
                    description: {
                        identifier: fileBasedIdentifier,
                        places_feature: system.getCache().features
                    }
                },
                "minecraft:aggregate_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    features: system.getCache().features
                },
                "minecraft:cave_carver_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    fill_with: allBlocks
                },
                "minecraft:fossil_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    ore_block: allBlocks
                },
                "minecraft:geode_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    filler: allBlocks,
                    inner_layer: allBlocks,
                    alternate_inner_layer: allBlocks,
                    middle_layer: allBlocks,
                    outer_layer: allBlocks,
                    inner_placements: allBlocks
                },
                "minecraft:growing_plant_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    body_blocks: allBlocks,
                    head_blocks: allBlocks
                },
                "minecraft:multiface_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    can_place_on: allBlocks,
                    places_block: allBlocks
                },
                "minecraft:nether_cave_carver_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    fill_with: allBlocks
                },
                "minecraft:ore_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    replace_rules: {
                        places_block: allBlocks,
                        may_replace: allBlocks
                    }
                },
                "minecraft:partially_exposed_blob_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    places_block: allBlocks
                },
                "minecraft:scatter_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    places_feature: system.getCache().features
                },
                "minecraft:search_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    places_feature: system.getCache().features
                },
                "minecraft:sequence_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    features: system.getCache().features
                },
                "minecraft:single_block_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    places_block: allBlocks,
                    may_replace: allBlocks,
                    may_attach_to: allBlocks
                },
                "minecraft:snap_to_surface_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    feature_to_snap: system.getCache().features
                },
                "minecraft:structure_template_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    structure_name: system.getCache().structures,
                    constraints: {
                        block_intersection: {
                            block_allowlist: allBlocks,
                            block_whitelist: allBlocks
                        }
                    }
                },
                "minecraft:surface_relative_threshold_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    feature_to_place: system.getCache().features
                },
                "minecraft:tree_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
                },
                "minecraft:underwater_cave_carver_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    fill_with: allBlocks,
                    replace_air_with: allBlocks
                },
                "minecraft:vegetation_patch_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    vegetation_feature: system.getCache().features,
                    replaceable_blocks: allBlocks,
                    ground_block: allBlocks,
                },
                "minecraft:weighted_random_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    features: system.getCache().features
                },
                "minecraft:recipe_shaped": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    key: {
                        property: jsonInDoc["minecraft:recipe_shaped"] ? (jsonInDoc["minecraft:recipe_shaped"]?.["pattern"] ? (jsonInDoc["minecraft:recipe_shaped"]["pattern"].length >= 1 ? Array.from(new Set(jsonInDoc["minecraft:recipe_shaped"]["pattern"].join('').split(''))) : []) : []) : [],
                        item: allItems
                    },
                    unlock: {
                        item: allItems
                    },
                    result: {
                        item: allItems
                    }
                },
                "minecraft:recipe_brewing_container": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    input: allItems,
                    output: allItems,
                    reagent: allItems
                },
                "minecraft:recipe_brewing_mix": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    input: allItems,
                    output: allItems,
                    reagent: allItems
                },
                "minecraft:recipe_furnace": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    unlock: {
                        item: allItems
                    },
                    input: allItems,
                    output: allItems
                },
                "minecraft:recipe_shapeless": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    unlock: {
                        item: allItems
                    },
                    ingredients: {
                        item: allItems
                    },
                    result: {
                        item: allItems
                    }
                },
                "minecraft:recipe_smithing_transform": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    template: allItems,
                    base: allItems,
                    result: allItems,
                    addition: 'minecraft:netherite_ingot'
                },
                entity_sounds: {
                    entities: {
                        events: {
                            sound: system.getCache().sound_definitions
                        }
                    }
                },
                sound_definitions: {
                    sounds: system.getCache().sounds
                },
                texture_data: {
                    textures: system.getCache().textures.paths
                },
                particle_effect: {
                    description: {
                        identifier: fileBasedIdentifier,
                        basic_render_parameters: {
                            texture: system.getCache().textures.paths
                        }
                    }
                },
                animation_controllers: {
                    states: {
                        transitions: jsonInDoc['animation_controllers'] ? Object.keys(valueFromJsonPath(actualPath.slice(0, -4), jsonInDoc)) : []
                    }
                }
            }

            switch (document.fileName.split('\\').pop()) {
                case 'blocks.json':
                    value = system.getCache().block.ids.filter(id => !jsonInDoc[id])
                    break;
                default:
                    value = valueFromJsonPath(jsonPath, dynamicAutocomplete)
                    const valueInDoc = valueFromJsonPath(jsonPath, jsonInDoc)
                    if (valueInDoc instanceof Array && typeof value != 'string') value = value.filter(x => !valueInDoc.includes(x))
                    break;
            };

            if (typeof value == 'string') value = [value];

            const line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).trim()

            value.forEach(x => {
                const item = new vscode.CompletionItem(x, vscode.CompletionItemKind.Enum)
                let overlapLength = 0;
                for (let i = 1; i <= x.length; i++) {
                    if (line.endsWith(x.slice(0, i))) {
                        overlapLength = i;
                    }
                }
                item.range = new vscode.Range(new vscode.Position(position.line, position.character - overlapLength), position);
                suggestions.push(item)
            })

            return suggestions
        }
    })

}

function valueFromJsonPath(path, object) {
    return path.reduce((acc, key) => acc && acc[key], object)
}

function isInQuotes(_, offset, length, document, position) {
    if (document.offsetAt(position) > offset && document.offsetAt(position) < offset + length) return true
    return false

}

module.exports = { createJsonProvider }