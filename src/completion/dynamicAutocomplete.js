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

            const suggestions = [];
            const prefix = vscode.workspace.getConfiguration('bedrocken').get('project_prefix', 'bedrocken');
            const fileBasedIdentifier = prefix + ':' + document.fileName.split('\\').pop().slice(0, -5);

            let jsonPath = getLocation(document.getText(), document.offsetAt(position)).path.filter(x => typeof x != 'number')
                .join('[|]')
                .replace('minecraft:icon[|]textures[|]default', 'minecraft:icon')
                .replace('permutations[|]', '')
                .replace(/minecraft:material_instances\[[^\]]*\]([^[]*)texture/, 'minecraft:material_instances[|]*[|]texture')
                .replace(/_groups\[\|\][a-zA-Z0-9$!_]+/g, 's')
                .replace(/(?<=minecraft:entity).*?(?=filters)/g, '[|]')
                .replace(/\[\|\](all_of|any_of|none_of)/g, '')
                .split('[|]')

            let value = [];
            let inQuotes = false;

            visit(document.getText(), {
                onLiteralValue: (value, offset, length) => inQuotes = !inQuotes ? isInQuotes(value, offset, length, document, position) : true,
                onObjectProperty: (value, offset, length) => inQuotes = !inQuotes ? isInQuotes(value, offset, length, document, position) : true
            });

            if (!inQuotes) return;

            const jsonInDoc = parse(document.getText())

            if (jsonPath.includes('minecraft:entity') && jsonPath.includes('filters')) {
                const testPath = getLocation(document.getText(), document.offsetAt(position)).path.slice(0, -1)
                testPath.push("test")
                const test = valueFromJsonPath(testPath, jsonInDoc)
                if (!test) return;
                jsonPath.push(test)
            }

            const dynamicAutocomplete = {
                "minecraft:entity": {
                    description: {
                        identifier: fileBasedIdentifier
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
                        "minecraft:icon": system.getCache().textures.items
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
                        "minecraft:loot": system.getCache().loot_tables.filter(x => x.startsWith('loot_tables/block'))
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
                    }
                },
                "minecraft:fossil_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
                },
                "minecraft:geode_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
                },
                "minecraft:growing_plant_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
                },
                "minecraft:multiface_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
                },
                "minecraft:nether_cave_carver_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
                },
                "minecraft:ore_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
                },
                "minecraft:partially_exposed_blob_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    }
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
                    }
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
                    structure_name: system.getCache().structures
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
                    }
                },
                "minecraft:vegetation_patch_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    vegetation_feature: system.getCache().features
                },
                "minecraft:weighted_random_feature": {
                    description: {
                        identifier: fileBasedIdentifier
                    },
                    features: system.getCache().features
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