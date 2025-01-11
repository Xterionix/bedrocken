const { exists } = require('../sub/util');
const { getAllFilePaths } = require('../sub/cacheSystem');

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { parse, stringify } = require('comment-json');

const completelyRemovedComponents = ['minecraft:dye_powder', 'minecraft:armor', 'minecraft:creative_category', 'minecraft:knockback_resistance', 'minecraft:render_offsets', 'minecraft:animates_in_toolbar', 'minecraft:ignores_permission', 'minecraft:explodable', 'minecraft:mining_speed', 'minecraft:mirrored_art', 'minecraft:fertilizer', 'minecraft:frame_count', 'minecraft:requires_interact', 'minecraft:map', 'minecraft:shears', 'minecraft:bucket', 'saddle']

async function updateItems(bpPath) {

    vscode.window.showInformationMessage('This feature is not availible yet.'); return;

    const itemsPath = path.join(bpPath, 'items');

    if (!(await exists(itemsPath))) return;

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Updating Items",
        cancellable: false
    }, (progress, token) => {
        return new Promise(async (resolve, reject) => {

            const filePaths = await getAllFilePaths(itemsPath);
            const totalFiles = filePaths.length;

            for (let index = 0; index < filePaths.length; index++) {
                const filePath = filePaths[index];

                try {

                    const fileContent = parse((await fs.promises.readFile(filePath)).toString());
                    const originalContent = stringify(fileContent, null, 4);

                    const item = fileContent["minecraft:item"]
                    const components = item['components']
                    const description = item['description']
                    const identifier = description["identifier"]

                    fileContent["format_version"] = "1.20.80";

                    const creativeCategoryComponent = components["minecraft:creative_category"]
                    const repairableComponent = components["minecraft:repairable"]
                    const iconComponent = components["minecraft:icon"]
                    const wearableComponent = components["minecraft:wearable"]
                    const armorComponent = components["minecraft:armor"]
                    const tagsComponents = components["minecraft:tags"]

                    if (creativeCategoryComponent) {
                        const creativeCategory = Object.values(creativeCategoryComponent)[0];
                        const categoryKey = creativeCategory.includes('itemGroup') ? 'group' : 'category';
                        description["menu_category"] = { [categoryKey]: creativeCategory }
                    }

                    if (description["category"]) {
                        if (description["menu_category"]) description["menu_category"].category = description["category"]
                        else description["menu_category"] = { category: description["category"] };
                    }

                    const tags = Object.keys(components).filter(component => component.startsWith('tag')).map(tag => tag.replace('tag:', ''))

                    tags.forEach(tag => delete components['tag:' + tag])

                    if (tags.length) {
                        if (!tagsComponents) components["minecraft:tags"] = { "tags": tags }
                        else {
                            if (tagsComponents.tags) tagsComponents.tags = Array.from(new Set(tags.concat(tagsComponents.tags)))
                            else tagsComponents.tags = tags
                        }
                    }

                    if (iconComponent) components["minecraft:icon"] = innerMostValue(components["minecraft:icon"]);

                    if (repairableComponent?.repair_items) repairableComponent['repair_items'] = repairableComponent["repair_items"].filter(entry => entry.items.filter(item => item !== identifier))

                    if (repairableComponent?.repair_items?.length == 0) delete components["minecraft:repairable"]

                    if (armorComponent?.protection && wearableComponent) wearableComponent.protection = armorComponent.protection

                    completelyRemovedComponents.forEach(id => delete fileContent["minecraft:item"]["components"][id])

                    delete description["category"];
                    delete item["events"];

                    const editedContent = stringify(fileContent, null, 4);

                    if (editedContent != originalContent) await fs.promises.writeFile(filePath, stringify(fileContent, null, 4));

                    progress.report({ increment: (index + 1) / totalFiles * 100 });

                } catch (error) {
                    vscode.window.showErrorMessage(`An error occured while reading ${path.relative(bpPath, filePath)}`)
                    console.warn(error)
                }

            }

            resolve()

        });
    })
}

function innerMostValue(json) {
    if (typeof json == 'string') return json;
    const values = Object.values(json)
    if (typeof values[0] == 'string') return values[0]
    else return innerMostValue(values[0])
}

module.exports = { updateItems }