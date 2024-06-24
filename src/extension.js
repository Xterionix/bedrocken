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

const { createJsonProvider } = require('./completion/dynamicAutocomplete')
const { createLangProvider } = require('./completion/langAutocomplete')

const { CacheSystem } = require('./sub/cacheSystem');
const { Filewatcher } = require('./sub/fileWatcher');

const glob = require('glob');
const path = require('path');
const vscode = require('vscode');
const fs = require('fs');
const { parse } = require('jsonc-parser');

// TODO: More dynamic autocomplete
// TODO: Improve cache system
// TODO: Add support for new project 

const system = new CacheSystem()

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	console.log("Bedrocken is Active!")

	let bpPath = vscode.workspace.workspaceFolders[0].uri.fsPath
	let rpPath = vscode.workspace.workspaceFolders[1]?.uri.fsPath

	const config = path.join(bpPath, (await glob.glob("**/config.json", { cwd: bpPath }))[0])

	if (config !== bpPath) {
		const configContent = (await fs.promises.readFile(config)).toString()
		if (configContent.includes('regolith')) {
			const configJson = parse(configContent)
			bpPath = path.join(config.split(path.sep).slice(0, -1).join(path.sep), configJson["packs"]["behaviorPack"])
			rpPath = path.join(config.split(path.sep).slice(0, -1).join(path.sep), configJson["packs"]["resourcePack"])
		}
	}

	try {

		const manifest = parse((await fs.promises.readFile(path.join(bpPath, 'manifest.json'))).toString())
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

		const fileWatcher = new Filewatcher(system, bpPath, rpPath)

		context.subscriptions.push(fileWatcher)

	} catch (error) { }

	const addScriptsManifestCommand = vscode.commands.registerCommand('bedrocken.add_scripts_manifests', () => addScriptsToManifest())
	const linkManifestsCommand = vscode.commands.registerCommand('bedrocken.link_manifests', () => linkManifests())

	const exportBpCommand = vscode.commands.registerCommand('bedrocken.export_bp', () => exportBp())
	const exportRpCommand = vscode.commands.registerCommand('bedrocken.export_rp', () => exportRp())
	const exportProjectCommand = vscode.commands.registerCommand('bedrocken.export_project', () => exportProject())
	const openExportsFolderCommand = vscode.commands.registerCommand('bedrocken.open_exports_folder', () => openExportsFolder())

	const updateItemsCommands = vscode.commands.registerCommand('bedrocken.update_items', () => updateItems());
	const generateTextureListCommands = vscode.commands.registerCommand('bedrocken.generate_texture_list', () => generateTextureList(rpPath));

	const projectSwitcherCommand = vscode.commands.registerCommand('bedrocken.switch_projects', () => projectSwitcher(context))
	const presetsCommand = vscode.commands.registerCommand('bedrocken.presets', () => presets(context, bpPath, rpPath))
	const snippetsCommand = vscode.commands.registerCommand('bedrocken.snippets', () => snippets(context, bpPath, rpPath))
	const setProjectPrefixCommand = vscode.commands.registerCommand('bedrocken.project_prefix', () => chooseProjectPrefix())

	const dynamicAutocomplete = createJsonProvider(system)
	const langAutocomplete = createLangProvider(system)

	context.subscriptions.push(
		langAutocomplete, dynamicAutocomplete, projectSwitcherCommand, snippetsCommand, presetsCommand, exportBpCommand, exportRpCommand, exportProjectCommand, openExportsFolderCommand, linkManifestsCommand, addScriptsManifestCommand, setProjectPrefixCommand, updateItemsCommands, generateTextureListCommands
	);

}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}