# Bedrocken

An extension that provides some helpful features for bedrock addon development.

## Features

### Project Exports

A command that allows you to export you BP/RP/Addons directly.

### Project Switcher

A command that allows you to switch projects from within your designated projects folder.

### Link Manifests

Clicking on a `manifest.json` shows a new option to link the BP and RPs together.

### Add scripts

Clicking on a `manifest.json` allows you to easily add scripts.

### Dynamic Autocomplete

`Control + P > Set Project Prefix` to change the namespace

Supports the following:

- File name based identifiers
- Structure names with a structure feature
- Item components & Block components
- Entity components
- Entity property filters
- Entity BPA and BPAC
- Client entity and attachable file
- Feature names within feature rules and features that place other features
- Spawn rule identifiers suggesting the names of entities in the project
- `blocks.json`, `sounds.json`, `sound_definitions.json`, `item_texture.json`, `terrain_texture.json`, `flipbook_texture.json` and `tick.json` files
- Shaped recipe keys and recipe item identifiers
- Animation controllers suggest states under transitions
- .lang files
- Entity, item and blocks id in blocks, item, entity and feature files
- Adding and removing component groups
- Loot table items
- Rawtext translation from scripts

### Presets

`Control + P > Presets` allows you to quickly generate files

### Snippets

`Control + P > Snippets` allows you to quickly do simple tasks within your files

### Create Project

`Control + P > Create New Project` creates a new `com.mojang` project. The RP description, by default is the same as the BP.

### Generate Files

`Control + P > Generate:`, supported files include the following:

- `texture_list.json`
- `sound_definitions.json`
- `item_texture.json`
- `terrain_texture.json`
