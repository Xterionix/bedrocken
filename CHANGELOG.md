# Change Log

All notable changes to the "bedrocken" extension will be documented in this file.

## [1.0.0]

- Initial release

## [1.1.0]

- Prevented vanilla lang keys from being suggested by autocomplete
- Made block loot table suggestions not restricted to "loot_tables/blocks"
- Made custom entity spawn egg items show up in autocompletion
- Fixed render controller suggestions in the format "{"controller.render.name": "query.is_baby"}"
- Fixed comments being included in project export name
- Added addBlockIcon context option to blocks

## [1.2.0]

- Added support for `minecraft:item_visual`

## [1.3.0]

- Added support for item crafting catalog files
- Added caching and completion for block sounds

## [1.4.0]

- Added attachable, function file type
- Added completion for initial state in animation controllers
- Fixed function cache not being updated
- Made § get removed when parsing pack.name for exports

### [1.4.1]

- Fixed x:a preventing x:a_b from showing in lang completion
- Fixed error when parsing `sounds.json` & `sound_definitions.json`
