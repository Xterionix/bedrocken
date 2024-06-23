const { projectSwitcher } = require('./commands/projectSwitcher');
const { presets } = require('./commands/presets');
const { snippets } = require('./commands/snippets');
const { exportBp } = require('./commands/exportBp');
const { exportRp } = require('./commands/exportRp');
const { exportProject } = require('./commands/exportProject');
const { openExportsFolder } = require('./commands/openExportsFolder');
const { linkManifests } = require('./commands/linkManifests');
const { addScriptsToManifest } = require('./commands/addScriptsToManifest');
const { chooseProjectPrefix } = require('./commands/chooseProjectPrefix');
const { updateItems } = require('./commands/updateItems');

const { CacheSystem } = require('./sub/cacheSystem');

const path = require('path');
const vscode = require('vscode');
const fs = require('fs');
const { parse, getLocation, visit } = require('jsonc-parser');

// TODO: More dynamic autocomplete
// TODO: Make enum_property filter return enum specific values
// TODO: Improve cache system
// TODO: Add support for regolith autocomplete
// TODO: Add support for new project 

const system = new CacheSystem()

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	console.log("Bedrocken is Active!")

	const bpPath = vscode.workspace.workspaceFolders[0].uri.fsPath
	const rpPath = vscode.workspace.workspaceFolders[1]?.uri.fsPath

	if (fs.existsSync(path.join(bpPath, 'manifest.json'))) {

		const manifest = parse(fs.readFileSync(path.join(bpPath, 'manifest.json')).toString())
		if (!manifest["modules"]?.map(obj => obj.type).includes('script')) vscode.commands.executeCommand('setContext', 'bedrocken.can_add_scripts', true)
		if (!manifest["dependencies"]?.map(obj => obj.version instanceof Array).includes(true)) vscode.commands.executeCommand('setContext', 'bedrocken.can_link_manifests', true)

		await system.processDirectory(path.join(bpPath, 'scripts'), 'script')
		await system.processDirectory(path.join(bpPath, 'entities'), 'entity');
		await system.processDirectory(path.join(bpPath, 'items'), 'item');
		await system.processDirectory(path.join(bpPath, 'blocks'), 'block');
		await system.processDirectory(path.join(bpPath, 'features'), 'feature');
		await system.processDirectory(path.join(bpPath, 'structures'), 'structure');
		await system.processGlob(bpPath, 'loot_tables/**/*.json', 'loot_table')
		await system.processGlob(bpPath, 'trade_tables/**/*.json', 'trade_table')
		if (rpPath) await system.processFile(path.join(rpPath, 'textures/item_texture.json'), 'item_texture')
		if (rpPath) await system.processFile(path.join(rpPath, 'textures/terrain_texture.json'), 'terrain_texture')

		const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{json,mcstructure}', false, false, false)

		fileWatcher.onDidDelete(e => {

			if (e.fsPath.includes(' copy.json')) return;

			const workspace = vscode.workspace.workspaceFolders.find(folder => e.fsPath.startsWith(folder.uri.fsPath)).index == 0 ? bpPath : rpPath
			const folderName = path.relative(workspace, e.fsPath).split('\\')[0]
			const readPath = path.join(workspace, folderName)

			switch (folderName) {
				case 'items': system.getCache().item.ids = []; system.processDirectory(readPath, 'item');
					break;
				case 'entities': system.resetEntityCache(); system.processDirectory(readPath, 'entity');
					break;
				case 'blocks': system.getCache().block.ids = []; system.processDirectory(readPath, 'block');
					break;
				case 'features': system.getCache().features = []; system.processDirectory(readPath, 'feature')
					break;
				case 'loot_tables': system.getCache().loot_tables = []; system.processGlob(bpPath, 'loot_tables/**/*.json', 'loot_table');
					break;
				case 'trade_tables': system.getCache().trade_tables = []; system.processGlob(bpPath, 'trade_tables/**/*.json', 'trade_table');
					break;
				case 'structures': system.getCache().structures = []; system.processDirectory(readPath, 'structure')
					break;
				case 'scripts': system.getCache().block.custom_components = []; system.getCache().item.custom_components = []; system.processDirectory(readPath, 'script');
					break;
			}

		})

		fileWatcher.onDidChange(e => {

			if (e.fsPath.includes(' copy.json')) return;

			const workspace = vscode.workspace.workspaceFolders.find(folder => e.fsPath.startsWith(folder.uri.fsPath)).index == 0 ? bpPath : rpPath
			const folderName = path.relative(workspace, e.fsPath).split('\\')[0]
			const readPath = path.join(workspace, folderName)
			const fileName = path.basename(e.fsPath)

			switch (folderName) {
				case 'items': system.getCache().item.ids = []; system.processDirectory(readPath, 'item');
					break;
				case 'entities': system.resetEntityCache(); system.processDirectory(readPath, 'entity');
					break;
				case 'blocks': system.getCache().block.ids = []; system.processDirectory(readPath, 'block');
					break;
				case 'features': system.getCache().features = []; system.processDirectory(readPath, 'feature')
					break;
				case 'scripts': system.getCache().block.custom_components = []; system.getCache().item.custom_components = []; system.processDirectory(readPath, 'script');
					break;
			}

			switch (fileName) {
				case 'item_texture.json': system.getCache().textures.items = []; system.processFile(path.join(rpPath, 'textures/item_texture.json'), 'item_texture')
					break;
				case 'terrain_texture.json': system.getCache().textures.terrain = []; system.processFile(path.join(rpPath, 'textures/terrain_texture.json'), 'terrain_texture')
					break;
				case 'manifest.json': if (workspace != bpPath) return;
					const manifest = parse(fs.readFileSync(path.join(bpPath, 'manifest.json')).toString())
					vscode.commands.executeCommand('setContext', 'bedrocken.can_add_scripts', !manifest["modules"]?.map(obj => obj.type).includes('script'))
					vscode.commands.executeCommand('setContext', 'bedrocken.can_link_manifests', !manifest["dependencies"]?.map(obj => obj.version instanceof Array).includes(true))
					break;
			}

		})

		fileWatcher.onDidCreate(e => {

			if (e.fsPath.includes(' copy.json')) return;

			const workspace = vscode.workspace.workspaceFolders.find(folder => e.fsPath.startsWith(folder.uri.fsPath)).index == 0 ? bpPath : rpPath
			const folderName = path.relative(workspace, e.fsPath).split('\\')[0]
			const readPath = path.join(workspace, folderName)

			switch (folderName) {
				case 'items': system.getCache().item.ids = []; system.processDirectory(readPath, 'item');
					break;
				case 'entities': system.resetEntityCache(); system.processDirectory(readPath, 'entity');
					break;
				case 'blocks': system.getCache().block.ids = []; system.processDirectory(readPath, 'block');
					break;
				case 'features': system.getCache().features = []; system.processDirectory(readPath, 'feature')
					break;
				case 'loot_tables': system.getCache().loot_tables = []; system.processGlob(bpPath, 'loot_tables/**/*.json', 'loot_table');
					break;
				case 'trade_tables': system.getCache().trade_tables = []; system.processGlob(bpPath, 'trade_tables/**/*.json', 'trade_table');
					break;
				case 'structures': system.getCache().structures = []; system.processDirectory(readPath, 'structure')
					break;
				case 'scripts': system.getCache().block.custom_components = []; system.getCache().item.custom_components = []; system.processDirectory(readPath, 'script');
					break;
			}

		})

		context.subscriptions.push(fileWatcher)

	}

	const addScriptsManifestCommand = vscode.commands.registerCommand('bedrocken.add_scripts_manifests', () => addScriptsToManifest())
	const linkManifestsCommand = vscode.commands.registerCommand('bedrocken.link_manifests', () => linkManifests())

	const exportBpCommand = vscode.commands.registerCommand('bedrocken.export_bp', () => exportBp())
	const exportRpCommand = vscode.commands.registerCommand('bedrocken.export_rp', () => exportRp())
	const exportProjectCommand = vscode.commands.registerCommand('bedrocken.export_project', () => exportProject())
	const openExportsFolderCommand = vscode.commands.registerCommand('bedrocken.open_exports_folder', () => openExportsFolder())

	const updateItemsCommands = vscode.commands.registerCommand('bedrocken.update_items', () => updateItems());

	const projectSwitcherCommand = vscode.commands.registerCommand('bedrocken.switch_projects', () => projectSwitcher(context))
	const presetsCommand = vscode.commands.registerCommand('bedrocken.presets', () => presets(context, bpPath, rpPath))
	const snippetsCommand = vscode.commands.registerCommand('bedrocken.snippets', () => snippets(context, bpPath, rpPath))
	const setProjectPrefixCommand = vscode.commands.registerCommand('bedrocken.project_prefix', () => chooseProjectPrefix())

	const dynamicAutocomplete = vscode.languages.registerCompletionItemProvider(
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

	vscode.workspace.onDidChangeTextDocument(event => {
		if (!event.document.fileName.endsWith('.lang')) return;
		if (event.contentChanges.some(x => x.text.includes('='))) vscode.commands.executeCommand('editor.action.triggerSuggest');
	})

	const langAutocomplete = vscode.languages.registerCompletionItemProvider(
		[
			{ scheme: 'file', language: 'bc-minecraft-language' },
			{ scheme: 'file', language: 'plaintext' }
		], {
		provideCompletionItems(document, position) {
			const suggestions = []
			const line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).replace('.name', '')
			if (line.includes('=')) return [Object.assign(new vscode.CompletionItem(
				line.split('=')[0].split(':').pop().split('_').map(str => str[0].toUpperCase() + str.slice(1)).join(' '),
				vscode.CompletionItemKind.EnumMember
			), { sortText: '0' })];
			if (!document.fileName.endsWith('.lang')) return
			const text = document.getText().split('\n')
			system.getCache().entity.ids.forEach(id => {
				if (!text.some(x => x.startsWith(`entity.${id}.name`))) suggestions.push(new vscode.CompletionItem(`entity.${id}.name`, vscode.CompletionItemKind.Class))
			})
			system.getCache().entity.spawnable_ids.forEach(id => {
				if (!text.some(x => x.startsWith(`item.spawn_egg.entity.${id}.name`))) suggestions.push(new vscode.CompletionItem(`item.spawn_egg.entity.${id}.name`, vscode.CompletionItemKind.Class))
			})
			system.getCache().entity.rideable_ids.forEach(id => {
				if (!text.some(x => x.startsWith(`action.hint.exit.${id}`))) suggestions.push(new vscode.CompletionItem(`action.hint.exit.${id}`, vscode.CompletionItemKind.Class))
			})
			system.getCache().item.ids.forEach(id => {
				if (!text.some(x => x.startsWith(`item.${id}`))) suggestions.push(new vscode.CompletionItem(`item.${id}`, vscode.CompletionItemKind.Class))
			})
			system.getCache().block.ids.forEach(id => {
				if (!text.some(x => x.startsWith(`tile.${id}`))) suggestions.push(new vscode.CompletionItem(`tile.${id}.name`, vscode.CompletionItemKind.Class))
			})
			return suggestions
		}
	})

	context.subscriptions.push(
		langAutocomplete,
		dynamicAutocomplete,
		projectSwitcherCommand,
		snippetsCommand,
		presetsCommand,
		exportBpCommand,
		exportRpCommand,
		exportProjectCommand,
		openExportsFolderCommand,
		linkManifestsCommand,
		addScriptsManifestCommand,
		setProjectPrefixCommand,
		updateItemsCommands
	);

}

function mergeDeep(target, source) {
	for (const key in source) {
		if (source[key] instanceof Object && !Array.isArray(source[key])) {
			if (!target[key]) target[key] = {};
			mergeDeep(target[key], source[key]);
		} else if (Array.isArray(source[key])) {
			if (!target[key]) target[key] = [];
			target[key] = target[key].concat(source[key]);
		} else {
			target[key] = source[key];
		}
	}
	return target;
}

function deactivate() { }

module.exports = {
	activate,
	deactivate,
	mergeDeep
}