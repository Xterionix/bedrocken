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
const { generateTextureList } = require('./commands/generateTextureList');
const { generateSoundDefinitions } = require('./commands/generateSoundDefinitions');
const { generateItemTexture } = require('./commands/generateItemTexture');
const { generateTerrainTexture } = require('./commands/generateTerrainTexture');
const { createNewProject } = require('./commands/createNewProject');
const { addBlockItem } = require('./commands/addBlockItem');

const { createJsonProvider } = require('./completion/dynamicAutocomplete')
const { createLangProvider } = require('./completion/langAutocomplete')

const { exists } = require('./sub/util');
const { CacheSystem } = require('./sub/cacheSystem');
const { Filewatcher } = require('./sub/fileWatcher');
const { setBpPath, setRpPath } = require('./sub/globalVars')

const glob = require('glob');
const path = require('path');
const vscode = require('vscode');
const fs = require('fs');
const { parse } = require('jsonc-parser');

// TODO: Improve cache system 

const system = new CacheSystem()

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	console.log("Bedrocken is Active!")

	let bpPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath //TODO: Rely on manifest.json's within the folder
	let rpPath = vscode.workspace.workspaceFolders?.[1]?.uri.fsPath

	const workspacesPath = path.join(context.globalStorageUri.fsPath, 'workspaces');

	try {

		const config = path.join(bpPath, (await glob.glob("**/config.json", { cwd: bpPath })).pop() || bpPath)

		if (config && config !== bpPath) {
			const configContent = (await fs.promises.readFile(config)).toString()
			if (configContent.includes('regolith')) {
				const configJson = parse(configContent)
				bpPath = path.join(config.split(path.sep).slice(0, -1).join(path.sep), configJson["packs"]["behaviorPack"])
				rpPath = path.join(config.split(path.sep).slice(0, -1).join(path.sep), configJson["packs"]["resourcePack"])
			}
		}

	} catch (error) { }

	console.log('BP: ', bpPath);
	console.log('RP: ', rpPath);

	setBpPath(bpPath); setRpPath(rpPath);

	try {

		const manifest = parse((await fs.promises.readFile(path.join(bpPath, 'manifest.json'))).toString())
		if (!manifest["modules"]?.map(obj => obj.type).includes('script')) vscode.commands.executeCommand('setContext', 'bedrocken.can_add_scripts', true)
		if (!manifest["dependencies"]?.map(obj => obj.version instanceof Array).includes(true)) vscode.commands.executeCommand('setContext', 'bedrocken.can_link_manifests', true)

		await vscode.window.withProgress({
			title: 'Bedrocken: Caching data',
			location: vscode.ProgressLocation.Window,
			cancellable: false,
		}, async () => {

			await system.processDirectory(path.join(bpPath, 'animations'), 'bp_animation')
			await system.processDirectory(path.join(bpPath, 'animation_controllers'), 'bp_animationcontroller')
			await system.processDirectory(path.join(bpPath, 'scripts'), 'script')
			await system.processDirectory(path.join(bpPath, 'entities'), 'entity');
			await system.processDirectory(path.join(bpPath, 'items'), 'item');
			await system.processDirectory(path.join(bpPath, 'blocks'), 'block');
			await system.processDirectory(path.join(bpPath, 'features'), 'feature');
			await system.processDirectory(path.join(bpPath, 'item_catalog'), 'item_catalog');
			await system.processDirectory(path.join(bpPath, 'structures'), 'structure');
			await system.processGlob(bpPath, 'loot_tables/**/*.json', 'loot_table')
			await system.processGlob(bpPath, 'trading/**/*.json', 'trade_table')
			await system.processGlob(bpPath, 'functions/**/*.mcfunction', 'function')
			if (!rpPath) return;
			await system.processGlob(rpPath, 'sounds/**/*.{ogg,wav,mp3,fsb}', 'sound')
			await system.processGlob(rpPath, 'textures/**/*.{png,jpg,jpeg,tga}', 'texture')
			await system.processDirectory(path.join(rpPath, 'block_culling'), 'block_culling_rule')
			await system.processDirectory(path.join(rpPath, 'animations'), 'rp_animation')
			await system.processDirectory(path.join(rpPath, 'animation_controllers'), 'rp_animationcontroller')
			await system.processDirectory(path.join(rpPath, 'models'), 'model')
			await system.processDirectory(path.join(rpPath, 'entity'), 'rp_entity')
			await system.processDirectory(path.join(rpPath, 'particles'), 'particle')
			await system.processDirectory(path.join(rpPath, 'render_controllers'), 'rendercontroller')
			await system.processDirectory(path.join(rpPath, 'biomes'), 'client_biome')
			await system.processDirectory(path.join(rpPath, 'fogs'), 'fog')
			await system.processFile(path.join(rpPath, 'sounds.json'), 'sounds')
			await system.processFile(path.join(rpPath, 'sounds/sound_definitions.json'), 'sound_definition')
			await system.processFile(path.join(rpPath, 'textures/item_texture.json'), 'item_texture')
			await system.processFile(path.join(rpPath, 'textures/terrain_texture.json'), 'terrain_texture')

		})

		const fileWatcher = new Filewatcher(system, bpPath, rpPath)

		context.subscriptions.push(fileWatcher)

	} catch (error) { }

	if (!(await exists(workspacesPath))) await fs.promises.mkdir(workspacesPath, { recursive: true })

	const addScriptsManifestCommand = vscode.commands.registerCommand('bedrocken.add_scripts_manifests', () => addScriptsToManifest(bpPath))
	const linkManifestsCommand = vscode.commands.registerCommand('bedrocken.link_manifests', () => linkManifests(bpPath, rpPath))

	const exportBpCommand = vscode.commands.registerCommand('bedrocken.export_bp', () => exportBp(bpPath))
	const exportRpCommand = vscode.commands.registerCommand('bedrocken.export_rp', () => exportRp(rpPath))
	const exportProjectCommand = vscode.commands.registerCommand('bedrocken.export_project', () => exportProject(bpPath, rpPath))
	const openExportsFolderCommand = vscode.commands.registerCommand('bedrocken.open_exports_folder', () => openExportsFolder())
	const createNewProjectCommand = vscode.commands.registerCommand('bedrocken.new_project', () => createNewProject(context, workspacesPath))

	const updateItemsCommand = vscode.commands.registerCommand('bedrocken.update_items', () => updateItems(bpPath));
	const generateTextureListCommand = vscode.commands.registerCommand('bedrocken.generate_texture_list', () => generateTextureList(rpPath));
	const generateItemTextureCommand = vscode.commands.registerCommand('bedrocken.generate_item_texture', () => generateItemTexture(rpPath));
	const generateTerrainTextureCommand = vscode.commands.registerCommand('bedrocken.generate_terrain_texture', () => generateTerrainTexture(rpPath));
	const generateSoundDefinitionsCommand = vscode.commands.registerCommand('bedrocken.generate_sound_definitions', () => generateSoundDefinitions(rpPath));
	const addBlockItemCommand = vscode.commands.registerCommand('bedrocken.add_block_item', (res) => addBlockItem(res?.path, bpPath, rpPath, system));

	const projectSwitcherCommand = vscode.commands.registerCommand('bedrocken.switch_projects', () => projectSwitcher(context, workspacesPath))
	const presetsCommand = vscode.commands.registerCommand('bedrocken.presets', () => presets(context, bpPath, rpPath))
	const snippetsCommand = vscode.commands.registerCommand('bedrocken.snippets', () => snippets(context, bpPath, rpPath))
	const setProjectPrefixCommand = vscode.commands.registerCommand('bedrocken.projectPrefix', () => chooseProjectPrefix())

	const dynamicAutocomplete = createJsonProvider(system)
	const langAutocomplete = createLangProvider(system, bpPath)

	if (vscode.workspace.getConfiguration('bedrocken').get('jsonAutocomplete')) context.subscriptions.push(dynamicAutocomplete)
	if (vscode.workspace.getConfiguration('bedrocken').get('langAutocomplete')) context.subscriptions.push(langAutocomplete)

	context.subscriptions.push(
		projectSwitcherCommand, snippetsCommand, presetsCommand, exportBpCommand, exportRpCommand, exportProjectCommand, openExportsFolderCommand, linkManifestsCommand, addScriptsManifestCommand, setProjectPrefixCommand, updateItemsCommand, generateTextureListCommand, generateSoundDefinitionsCommand, createNewProjectCommand, generateItemTextureCommand, generateTerrainTextureCommand, addBlockItemCommand
	);

}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}