const { CacheSystem, getAllFilePaths } = require('./sub/cacheSystem');

const path = require('path')
const vscode = require('vscode');
const fs = require('fs')
const os = require('os')
const { exec } = require('child_process')
const { parse, getLocation, visit } = require('jsonc-parser')
const { parse: parseWithComments, stringify: toStringWithComments } = require('comment-json')
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver')

// TODO: Presets
// TODO: More dynamic autocomplete
// TODO: Make snippets not automatically save the file
// TODO: Improve cache system
// TODO: Add support for opening BP only projects
// TODO: Add support for ignoring .git folder on export
// TODO: Add support for regolith exports
// TODO: Add support for new project 

const appData = process.env.APPDATA
const downloadsFolder = path.join(os.homedir(), 'Downloads')

const scriptVersion = {
	"@minecraft/server": ["1.0.0", "1.1.0", "1.2.0", "1.3.0", "1.4.0", "1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.10.0", "1.11.0-beta", "1.11.0", "1.12.0-beta"],
	"@minecraft/server-ui": ["1.0.0", "1.1.0", "1.2.0-beta", "1.2.0", "1.3.0-beta"],
	"@minecraft/common": ["1.2.0", "1.1.0", "1.0.0"]
}

const explorerCommand = {
	"win32": "explorer",
	"darwin": "open",
	"linux": "xdg-open"
}

const system = new CacheSystem()

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	console.log("Bedrocken is Active!")

	const bpPath = vscode.workspace.workspaceFolders[0].uri.fsPath
	const rpPath = vscode.workspace.workspaceFolders[1]?.uri.fsPath

	if (!fs.existsSync(path.join(bpPath, 'manifest.json'))) return;

	const manifest = parse(fs.readFileSync(path.join(bpPath, 'manifest.json')).toString())
	if (!manifest["modules"]?.map(obj => obj.type).includes('script')) vscode.commands.executeCommand('setContext', 'bedrocken.can_add_scripts', true)
	if (!manifest["dependencies"]?.map(obj => obj.version instanceof Array).includes(true)) vscode.commands.executeCommand('setContext', 'bedrocken.can_link_manifests', true)

	await system.processDirectory(path.join(bpPath, 'scripts'), 'script')
	await system.processDirectory(path.join(bpPath, 'entities'), 'entity');
	await system.processDirectory(path.join(bpPath, 'items'), 'item');
	await system.processDirectory(path.join(bpPath, 'blocks'), 'block');
	await system.processFile(path.join(rpPath, 'textures/item_texture.json'), 'item_texture')
	await system.processFile(path.join(rpPath, 'textures/terrain_texture.json'), 'terrain_texture')

	const fileWatcher = vscode.workspace.createFileSystemWatcher('**/**/*.json', false, false, false)

	fileWatcher.onDidDelete(e => {

		if (e.fsPath.includes(' copy.json')) return;

		const workspace = vscode.workspace.workspaceFolders.find(folder => e.fsPath.startsWith(folder.uri.fsPath)).index == 0 ? bpPath : rpPath
		const folderName = path.relative(workspace, e.fsPath).split('\\')[0]
		const readPath = path.join(workspace, folderName)

		switch (folderName) {
			case 'items': system.getCache().item.ids = []; system.processDirectory(readPath, 'item');
				break;
			case 'entities': system.getCache().entity = { ids: [], rideable_ids: [], spawnable_ids: [] }; system.processDirectory(readPath, 'entity');
				break;
			case 'blocks': system.getCache().block.ids = []; system.processDirectory(readPath, 'block');
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
			case 'entities': system.getCache().entity = { ids: [], rideable_ids: [], spawnable_ids: [] }; system.processDirectory(readPath, 'entity');
				break;
			case 'blocks': system.getCache().block.ids = []; system.processDirectory(readPath, 'block');
				break;
			case 'scripts': system.getCache().block.custom_components = []; system.getCache().item.custom_components = []; system.processDirectory(readPath, 'script');
				break;
		}

		switch (fileName) {
			case 'item_texture.json': system.getCache().textures.items = []; system.processFile(path.join(rpPath, 'textures/item_texture.json'), 'item_texture')
				break;
			case 'terrain_texture.json': system.getCache().textures.terrain = []; system.processFile(path.join(rpPath, 'textures/terrain_texture.json'), 'terrain_texture')
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
			case 'entities': system.getCache().entity = { ids: [], rideable_ids: [], spawnable_ids: [] }; system.processDirectory(readPath, 'entity');
				break;
			case 'blocks': system.getCache().block.ids = []; system.processDirectory(readPath, 'block');
				break;
			case 'scripts': system.getCache().block.custom_components = []; system.getCache().item.custom_components = []; system.processDirectory(readPath, 'script');
				break;
		}

	})

	const resetManifestsCommandsCommands = vscode.commands.registerCommand('bedrocken.reset_manifest_commands', () => {
		vscode.commands.executeCommand('setContext', 'bedrocken.can_add_scripts', true)
		vscode.commands.executeCommand('setContext', 'bedrocken.can_link_manifests', true)
	})

	const updateItemsCommands = vscode.commands.registerCommand('bedrocken.update_items', () => {
		const itemsPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'items');
		if (!fs.existsSync(itemsPath)) return;

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Updating Items",
			cancellable: false
		}, (progress, token) => {
			return new Promise((resolve, reject) => {
				const filePaths = getAllFilePaths(itemsPath);
				const totalFiles = filePaths.length;

				filePaths.forEach((filePath, index) => {
					const fileContent = parseWithComments(fs.readFileSync(filePath).toString());

					delete fileContent["minecraft:item"]["events"];

					const creativeCategoryComponent = fileContent["minecraft:item"]["components"]["minecraft:creative_category"]

					if (creativeCategoryComponent) {
						const creativeCategory = Object.values(creativeCategoryComponent)[0];
						if (creativeCategory.includes('itemGroup')) {
							fileContent["minecraft:item"]["menu_category"] = { group: creativeCategory };
						} else {
							fileContent["minecraft:item"]["description"]["menu_category"] = { category: creativeCategory };
						}
						delete fileContent["minecraft:item"]["components"]["minecraft:creative_category"];
					}

					fileContent["format_version"] = "1.20.80";

					const icon = innerMostValue(fileContent["minecraft:item"]["components"]["minecraft:icon"]);
					fileContent["minecraft:item"]["components"]["minecraft:icon"] = icon;

					fs.writeFileSync(filePath, toStringWithComments(fileContent, null, 4));

					progress.report({ increment: (index + 1) / totalFiles * 100 });
				});

				resolve();
			});
		});
	});

	const projectSwitcherCommand = vscode.commands.registerCommand('bedrocken.switch_projects', async () => {

		try {
			const root = vscode.workspace.getConfiguration('bedrocken').get('folders', [`${appData.replace(/\\/g, '').replace('Roaming', '')}//Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang`])
			const options = []

			const manifests = {
				// 'something [bp]' : 'u2323-523254-2323-12af-g5a313'
			}
			const rpManifests = {
				// 'u2323-523254-2323-12af-g5a313' : 'something [rp]'
			}

			const locations = {
				// something [p] : c:/yser/saweea/a/e/a/e/ea/e/
			}

			root.forEach(location => {

				const bpDirectory = path.join(location, "development_behavior_packs")
				const rpDirectory = path.join(location, "development_resource_packs")

				if (!fs.existsSync(bpDirectory)) {
					vscode.window.showErrorMessage("Could not find development_behavior_packs")
					return;
				}

				if (!fs.existsSync(rpDirectory)) {
					vscode.window.showErrorMessage("Could not find development_resource_packs")
					return;
				}

				const files = fs.readdirSync(bpDirectory)

				files.forEach(file => {
					if (!fs.statSync(path.join(bpDirectory, file)).isDirectory()) return;
					options.push(file)
					locations[file] = path.join(bpDirectory, file)
					try {
						manifests[file] = parse(fs.readFileSync(path.join(bpDirectory, file, 'manifest.json'), 'utf-8')).dependencies.filter(obj => obj.hasOwnProperty('uuid'))[0].uuid
					} catch (error) {
						console.log('Malformed manifest.json for ' + file)
					}
				})

				const rpfiles = fs.readdirSync(rpDirectory)

				rpfiles.forEach(file => {
					if (!fs.statSync(path.join(rpDirectory, file)).isDirectory()) return;
					locations[file] = path.join(rpDirectory, file)
					try {
						rpManifests[parse(fs.readFileSync(path.join(rpDirectory, file, 'manifest.json'), 'utf-8')).header.uuid] = file
					} catch (error) {
						console.log('Malformed manifest.json for ' + file)
					}
				})

			})

			if (options.length == 0) {
				vscode.window.showErrorMessage('No directories found')
				return;
			}
			vscode.window.showQuickPick(options.sort()).then(async selectedOption => {
				if (selectedOption) {
					const existingWorkspaceFile = path.join(context.extensionPath, 'data/workspaces', selectedOption.replace(' [BP]', '').replace(' [RP]', '').toLowerCase() + '.code-workspace')
					if (fs.existsSync(existingWorkspaceFile)) {
						vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(existingWorkspaceFile), false)
					} else {
						const data = {
							"folders": [
								{
									"path": locations[selectedOption].replace(/\\/g, '/')
								},
								{
									"path": locations[rpManifests[manifests[selectedOption]]].replace(/\\/g, '/')
								}
							],
							"settings": {}
						}
						await fs.promises.writeFile(existingWorkspaceFile, JSON.stringify(data, null, 4))
						await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(existingWorkspaceFile), false)
					}
				}
			});
		} catch (error) {
			console.log(error)
		}


	})

	const clearProjectCacheCommand = vscode.commands.registerCommand('bedrocken.clear_project_cache', () => {

		fs.readdir(path.join(context.extensionPath, 'data/workspaces'), (err, files) => {
			files.filter(x => !x.includes(vscode.workspace.name.split(' (Workspace)')[0])).forEach(file => {
				fs.unlink(path.join(context.extensionPath, 'data/workspaces', file), (err) => {
					if (err) console.log(err)
				})
			})
		})

	})

	const presetsCommand = vscode.commands.registerCommand('bedrocken.presets', () => {

		const presets = fs.readdirSync(path.join(context.extensionPath, 'data/presets'))

	})

	const snippetsCommand = vscode.commands.registerCommand('bedrocken.snippets', () => {

		const snippetFiles = getAllFilePaths(path.join(context.extensionPath, 'data/snippets'))
		let snippets = snippetFiles.map(snippet => JSON.parse(fs.readFileSync(snippet).toString()))

		if (!vscode.window.activeTextEditor) { vscode.window.showErrorMessage('Snippets can only be run when you have a file open'); return };

		const document = vscode.window.activeTextEditor.document
		const folderName = path.basename(path.dirname(document.fileName))
		const fileContent = parseWithComments(document.getText())
		const workspaceIndex = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.findIndex(folder => vscode.window.activeTextEditor.document.uri.fsPath.startsWith(folder.uri.fsPath)) : -1;
		const packType = workspaceIndex == 0 ? "bp" : "rp"
		const fileName = document.fileName.split('\\').pop()

		snippets = snippets.filter(snippet => snippet.folder == folderName).filter(snippet => snippet.packType == packType).filter(snippet => fileName.endsWith(snippet.fileType))

		if (snippets.length == 0) { vscode.window.showErrorMessage('No snippets found for this file type'); return };

		vscode.window.showQuickPick(snippets.map(x => ({ label: x.name, description: x.description }))).then(selectedOption => {
			if (!selectedOption) return;
			const i = snippets.findIndex(x => x.name == selectedOption.label)
			snippets[i].insertions.forEach(insertion => {
				const arr = insertion.path
				let current = fileContent;
				for (let i = 0; i < arr.length; i++) {
					if (!current[arr[i]]) current[arr[i]] = {}
					current = current[arr[i]];
				}
				Object.assign(current, insertion.data)
			})
			fs.writeFileSync(document.fileName, toStringWithComments(fileContent, null, 4))
		})

	})

	const exportBpCommand = vscode.commands.registerCommand('bedrocken.export_bp', async () => {

		let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
		if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
		location = downloadsFolder

		const extension = vscode.workspace.getConfiguration('bedrocken').get('export.file_type')
		const name = vscode.workspace.name.split(' (Workspace)')[0].split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(" ") + ' [BP].' + extension.split('/')[0]

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: 'Exporting BP',
			cancellable: false
		}, async () => {

			const output = fs.createWriteStream(path.join(location, name))

			const zip = archiver('zip', { zlib: { level: 9 } })

			zip.pipe(output)
			zip.directory(vscode.workspace.workspaceFolders[0].uri.fsPath, '')
			return zip.finalize()

		}).then(() => {
			vscode.window.showInformationMessage('BP Exported successfully', 'View in Folder').then(value => {
				if (value != 'View in Folder') return;
				vscode.commands.executeCommand('bedrocken.open_exports_folder')
			})
		});


	})

	const exportRpCommand = vscode.commands.registerCommand('bedrocken.export_rp', async () => {

		if (vscode.workspace.workspaceFolders.length == 1) {
			vscode.window.showErrorMessage('No resource pack found')
			return;
		}

		let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
		if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
		location = downloadsFolder

		const extension = vscode.workspace.getConfiguration('bedrocken').get('export.file_type')
		const name = vscode.workspace.name.split(' (Workspace)')[0].split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(" ") + ' [RP].' + extension.split('/')[0]

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: 'Exporting RP',
			cancellable: false
		}, async () => {

			const output = fs.createWriteStream(path.join(location, name))

			const zip = archiver('zip', { zlib: { level: 9 } })

			zip.pipe(output)
			zip.directory(vscode.workspace.workspaceFolders[1].uri.fsPath, '')
			return zip.finalize()

		}).then(() => {
			vscode.window.showInformationMessage('RP Exported successfully', 'View in Folder').then(value => {
				if (value != 'View in Folder') return;
				vscode.commands.executeCommand('bedrocken.open_exports_folder')
			})
		});

	})

	const exportProjectCommand = vscode.commands.registerCommand('bedrocken.export_project', async () => {

		let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
		if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
		location = downloadsFolder

		const extension = vscode.workspace.getConfiguration('bedrocken').get('export.file_type')
		const name = vscode.workspace.name.split(' (Workspace)')[0].split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join(" ") + '.' + extension.split('/').pop()

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: 'Exporting Project',
			cancellable: false
		}, async () => {

			const output = fs.createWriteStream(path.join(os.homedir(), 'Downloads', name))

			const zip = archiver('zip', { zlib: { level: 9 } })
			zip.pipe(output)
			zip.directory(vscode.workspace.workspaceFolders[0].uri.fsPath, vscode.workspace.workspaceFolders[0].name)
			if (vscode.workspace.workspaceFolders.length > 1) zip.directory(vscode.workspace.workspaceFolders[1].uri.fsPath, vscode.workspace.workspaceFolders[1].name)
			return zip.finalize()

		}).then(() => {
			vscode.window.showInformationMessage('Project Exported successfully', 'View in Folder').then(value => {
				if (value != 'View in Folder') return;
				vscode.commands.executeCommand('bedrocken.open_exports_folder')
			})
		});

	})

	const openExportsFolderCommand = vscode.commands.registerCommand('bedrocken.open_exports_folder', () => {

		let location = vscode.workspace.getConfiguration('bedrocken').get('export.location')
		if (!location) vscode.workspace.getConfiguration('bedrocken').update('export.location', downloadsFolder)
		location = downloadsFolder

		const userOS = os.platform()

		if (!Object.keys(explorerCommand).includes(userOS)) {
			vscode.window.showErrorMessage('Unsupported OS: ', userOS)
			return;
		}

		const command = explorerCommand[userOS]

		exec(`${command} ${path.join(location)}`, (err, stdout, stderr) => {
			if (err || stderr) {
				console.log('Err: ' + err, 'Std err: ' + stderr)
				return;
			}
		})

	})

	const linkManifestsCommand = vscode.commands.registerCommand('bedrocken.link_manifests', async () => {

		if (vscode.workspace.workspaceFolders.length == 1) {
			vscode.window.showErrorMessage('No resource pack found')
			return;
		}

		const bpManifestPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'manifest.json')
		const rpManifestPath = path.join(vscode.workspace.workspaceFolders[1].uri.fsPath, 'manifest.json')

		const bpManifest = parse((await fs.promises.readFile(bpManifestPath)).toString())
		const rpManifest = parse((await fs.promises.readFile(rpManifestPath)).toString())

		const bpDepen = (bpManifest["dependencies"] || []).filter(obj => !(obj.version instanceof Array))
		const rpDepen = (rpManifest["dependencies"] || []).filter(obj => !(obj.version instanceof Array))

		bpDepen.push({ "uuid": rpManifest["header"]["uuid"], "version": [1, 0, 0] })
		rpDepen.push({ "uuid": bpManifest["header"]["uuid"], "version": [1, 0, 0] })

		bpManifest["dependencies"] = bpDepen
		rpManifest["dependencies"] = rpDepen

		await fs.promises.writeFile(bpManifestPath, JSON.stringify(bpManifest, null, 4))
		await fs.promises.writeFile(rpManifestPath, JSON.stringify(rpManifest, null, 4))

		vscode.window.showInformationMessage("Manifests linked successfully!")
		vscode.commands.executeCommand("setContext", 'bedrocken.can_link_manifests', false)

	})

	const addScriptsManifestCommand = vscode.commands.registerCommand('bedrocken.add_scripts_manifests', async () => {

		const manifestPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'manifest.json')

		const manifest = parse((await fs.promises.readFile(manifestPath)).toString())

		const modules = manifest["modules"] || []
		let dependencies = manifest["dependencies"] || []

		if (modules.map(obj => obj.type).includes('script')) return;

		dependencies = dependencies.filter(obj => !obj.hasOwnProperty('module_name'))

		const versions = await vscode.window.showQuickPick(["@minecraft/server", "@minecraft/server-ui"], { canPickMany: true })

		if (!versions) return;

		for (const option of versions) {
			const version = await vscode.window.showQuickPick(scriptVersion[option].slice().reverse(), { title: option });
			dependencies.push({ "module_name": option, "version": version });
		}

		modules.push(
			{
				"type": "script",
				"language": "javascript",
				"version": [
					1,
					0,
					0
				],
				"entry": "scripts/index.js",
				"uuid": uuidv4()
			}
		)

		manifest["modules"] = modules
		manifest["dependencies"] = dependencies
		await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 4))

		vscode.window.showInformationMessage("Scripts added to `manifest.json`")
		vscode.commands.executeCommand("setContext", 'bedrocken.can_add_scripts', false)
	})

	const setProjectPrefixCommand = vscode.commands.registerCommand('bedrocken.project_prefix', async () => {

		vscode.window.showInputBox({ title: 'Project Prefix' }).then(value => {
			vscode.workspace.getConfiguration('bedrocken').update('project_prefix', value, vscode.ConfigurationTarget.Workspace)
			vscode.window.setStatusBarMessage('Project prefix set to ' + value, 2000)
		})

	})

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
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					}
				},
				"minecraft:item": {
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					},
					"components": {
						"minecraft:custom_components": system.getCache().item.custom_components,
						"minecraft:icon": system.getCache().textures.items
					}
				},
				"minecraft:feature_rules": {
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					}
				},
				"minecraft:single_block_feature": {
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					}
				},
				"minecraft:weighted_random_feature": {
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					}
				},
				"minecraft:scatter_feature": {
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					}
				},
				"minecraft:aggregate_feature": {
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					}
				},
				"minecraft:block": {
					"description": {
						"identifier": prefix + ':' + document.fileName.split('\\').pop().slice(0, -5)
					},
					"components": {
						"minecraft:custom_components": system.getCache().block.custom_components,
						"minecraft:material_instances": {
							"*": {
								"texture": system.getCache().textures.terrain
							}
						}
					}
					}
				}
				const jsonPath = getLocation(document.getText(), document.offsetAt(position)).path.filter(x => typeof x != 'number').join('[|]').replace('minecraft:icon[|]textures[|]default', 'minecraft:icon').replace('permutations[|]', '').replace(/minecraft:material_instances\[[^\]]*\]([^[]*)texture/, 'minecraft:material_instances[|]*[|]texture').split('[|]')
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
				if (value.length > 0) value.forEach(x => suggestions.push(Object.assign(new vscode.CompletionItem(x, vscode.CompletionItemKind.Enum), { sortText: '!' })))
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
		fileWatcher,
		langAutocomplete,
		dynamicAutocomplete,
		projectSwitcherCommand,
		clearProjectCacheCommand,
		snippetsCommand,
		presetsCommand,
		exportBpCommand,
		exportRpCommand,
		exportProjectCommand,
		openExportsFolderCommand,
		linkManifestsCommand,
		addScriptsManifestCommand,
		setProjectPrefixCommand,
		resetManifestsCommandsCommands,
		updateItemsCommands
	);

}

function innerMostValue(json) {
	const values = Object.values(json)
	if (typeof values[0] == 'string') return values[0]
	else return innerMostValue(values[0])
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}