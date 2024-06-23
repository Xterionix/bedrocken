const { CacheSystem } = require('../sub/cacheSystem');

const vscode = require('vscode');
const { parse, getLocation, visit } = require('jsonc-parser');

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
            const suggestions = []
            const prefix = vscode.workspace.getConfiguration('bedrocken').get('project_prefix', 'bedrocken')
            const dynamicAutocomplete = {
                "minecraft:entity": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
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
                            enum_property: system.getCache().entity.enum_properties.values,
                            bool_property: [true, false]
                        },
                        domain: {
                            bool_property: system.getCache().entity.boolean_properties,
                            int_property: system.getCache().entity.integer_properties,
                            float_property: system.getCache().entity.float_properties,
                            enum_property: system.getCache().entity.enum_properties.ids
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
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    components: {
                        "minecraft:custom_components": system.getCache().item.custom_components,
                        "minecraft:icon": system.getCache().textures.items
                    }
                },
                "minecraft:block": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    components: {
                        "minecraft:custom_components": system.getCache().block.custom_components,
                        "minecraft:material_instances": {
                            "*": {
                                texture: system.getCache().textures.terrain
                            }
                        },
                        "minecraft:loot": system.getCache().loot_tables.filter(x => x.startsWith('loot_tables/block'))
                    }
                },
                "minecraft:feature_rules": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5),
                        places_feature: system.getCache().features
                    }
                },
                "minecraft:aggregate_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    features: system.getCache().features
                },
                "minecraft:cave_carver_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:fossil_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:geode_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:growing_plant_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:multiface_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:nether_cave_carver_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:ore_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:partially_exposed_blob_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:scatter_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    places_feature: system.getCache().features
                },
                "minecraft:search_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    places_feature: system.getCache().features
                },
                "minecraft:sequence_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    features: system.getCache().features
                },
                "minecraft:single_block_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:snap_to_surface_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    feature_to_snap: system.getCache().features
                },
                "minecraft:structure_template_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    structure_name: system.getCache().structures
                },
                "minecraft:surface_relative_threshold_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    feature_to_place: system.getCache().features
                },
                "minecraft:tree_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:underwater_cave_carver_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    }
                },
                "minecraft:vegetation_patch_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    vegetation_feature: system.getCache().features
                },
                "minecraft:weighted_random_feature": {
                    description: {
                        identifier: prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
                    },
                    features: system.getCache().features
                }
            }
            let jsonPath = getLocation(document.getText(), document.offsetAt(position)).path.filter(x => typeof x != 'number').join('[|]').replace('minecraft:icon[|]textures[|]default', 'minecraft:icon').replace('permutations[|]', '').replace(/minecraft:material_instances\[[^\]]*\]([^[]*)texture/, 'minecraft:material_instances[|]*[|]texture').replace(/_groups\[\|\][a-zA-Z0-9$!_]+/g, 's').replace(/(?<=minecraft:entity).*?(?=filters)/g, '[|]').replace(/\[\|\](all_of|any_of|none_of)/g, '').split('[|]')
            let value = [];
            let inQuotes = false;
            visit(document.getText(), {
                onLiteralValue: (value, offset, length) => {
                    if (document.offsetAt(position) > offset && document.offsetAt(position) < offset + length) inQuotes = true
                },
                onObjectProperty: (value, offset, length) => {
                    if (document.offsetAt(position) > offset && document.offsetAt(position) < offset + length) inQuotes = true

                }
            });
            if (!inQuotes) return;
            if (jsonPath.includes('minecraft:entity') && jsonPath.includes('filters')) {
                const testPath = getLocation(document.getText(), document.offsetAt(position)).path.slice(0, -1)
                testPath.push("test")
                const test = testPath.reduce((acc, key) => acc && acc[key], parse(document.getText()))
                if (!test) return;
                jsonPath.push(test)
            }
            switch (document.fileName.split('\\').pop()) {
                case 'blocks.json':
                    value = system.getCache().block.ids.filter(id => !parse(document.getText())[id])
                    break;
                default:
                    value = jsonPath.reduce((acc, key) => acc && acc[key], dynamicAutocomplete)
                    const valueInDoc = jsonPath.reduce((acc, key) => acc && acc[key], parse(document.getText()))
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

module.exports = { createJsonProvider }