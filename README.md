# Bedrocken

An extension that provides some helpful features for bedrock addon development.

## Features

### Project Exports

A command that allows you to export you BP/RPs directly.

### Project Switcher

A command that allows you to switch projects from within your designated projects folder.

### Link Manifests

Clicking on a `manifest.json` shows a new option to link the BP and RPs together.

### Add scripts

Clicking on a `manifest.json` allows you to easily add scripts.

### Dynamic Autocomplete

Supports the following:

- File name based identifiers
- Structure names with a structure feature
- Item components `minecraft:icon` and `minecraft:custom_components`
- Block components `minecraft:material_instance`, `minecraft:custom_components` and `minecraft:loot`
- Entity components `minecraft:loot` and `minecraft:trade_table`
- Entity property filters
- Feature names within feature rules and features that place other features
- Spawn rule identifiers suggesting the names of entities in the project
- `blocks.json` file
- .lang files

### Presets

`Control + P > Presets` allows you to quickly generate files

### Snippets

`Control + P > Snippets` allows you to quickly do simple tasks within your files

### Create Project

`Control + P > Create New Project` creates a new `com.mojang` project. The RP description, by default is the same as the BP.

### Generate Files

`Control + P > Generate:`, supported files include the following:

- `texture_list.json`
