const { exists } = require('../sub/util');
const { getAllFilePaths } = require('../sub/cacheSystem');

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { parse, stringify } = require('comment-json');

async function updateItems() {

    const itemsPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'items');

    if (!(await exists(itemsPath))) return;

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Updating Items",
        cancellable: false
    }, (progress, token) => {
        return new Promise((resolve, reject) => {
            const filePaths = getAllFilePaths(itemsPath);
            const totalFiles = filePaths.length;

            filePaths.forEach(async (filePath, index) => {
                const fileContent = parse((await fs.promises.readFile(filePath)).toString());

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

                await fs.promises.writeFile(filePath, stringify(fileContent, null, 4));

                progress.report({ increment: (index + 1) / totalFiles * 100 });
            });

            resolve();
        });
    });

}

function innerMostValue(json) {
    const values = Object.values(json)
    if (typeof values[0] == 'string') return values[0]
    else return innerMostValue(values[0])
}

module.exports = { updateItems }