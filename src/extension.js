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

const { createJsonProvider } = require('./completion/dynamicAutocomplete')
const { createLangProvider } = require('./completion/langAutocomplete')

const { CacheSystem } = require('./sub/cacheSystem');

const path = require('path');
const vscode = require('vscode');
const fs = require('fs');
const { parse } = require('jsonc-parser');

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

	const dynamicAutocomplete = createJsonProvider(system)
	const langAutocomplete = createLangProvider(system)

	vscode.workspace.onDidChangeTextDocument(event => {
		if (!event.document.fileName.endsWith('.lang')) return;
		if (event.contentChanges.some(x => x.text.includes('='))) vscode.commands.executeCommand('editor.action.triggerSuggest');
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