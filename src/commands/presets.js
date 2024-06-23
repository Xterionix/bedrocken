const { mergeDeep } = require('../extension');
const { getAllFilePaths } = require('../sub/cacheSystem');

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { parse, stringify } = require('comment-json');

/**
 * @param {vscode.ExtensionContext} context
 * @param {string} bpPath
 * @param {string|undefined} rpPath
 */
function presets(context, bpPath, rpPath) {

    const presetFiles = getAllFilePaths(path.join(context.extensionPath, 'data/presets')).filter(x => x.includes('manifest.json'))
    let presets = presetFiles.map(preset => JSON.parse(fs.readFileSync(preset).toString()))

    if (presets.length == 0) { vscode.window.showErrorMessage('No presets found'); return };

    vscode.window.showQuickPick(presets.map(x => ({ label: x.name, description: x.description }))).then(async selectedOption => {

        if (!selectedOption) return;

        const i = presets.findIndex(x => x.name == selectedOption.label)
        const preset = presets[i]

        const packTypes = preset["packTypes"]
        const form = preset["form"]
        const createFiles = preset["createFiles"]
        const expandFiles = preset["expandFiles"]
        const copyFiles = preset["copyFiles"]
        const answers = []

        let capitalIdentifier = 'Bedrocken'

        if (packTypes.includes('rp') && !rpPath) { vscode.window.showErrorMessage('This preset requires a resource pack. No resource pack was found'); return }

        for (const question of form) {
            await vscode.window.showInputBox({ prompt: question.label, placeHolder: question.description }).then(answer => {
                answers.push(answer || question.id.replace(/{{/g, '').replace(/}}/g, ''))
                if (question.id == '{{IDENTIFIER}}') capitalIdentifier = answer[0].toUpperCase() + answer.slice(1).replace(/_/g, ' ')
            })
        }

        const variables = form.map(question => question.id)
        variables.push('{{PROJ_PREFIX}}')
        variables.push('{{IDENTIFIER_CAPITALIZE}}')
        answers.push(vscode.workspace.getConfiguration('bedrocken').get('project_prefix') || 'bedrocken')
        answers.push(capitalIdentifier)

        for (const createOptions of createFiles) {
            const createPath = path.join(createOptions.packType == 'bp' ? bpPath : rpPath, applyVariables(createOptions.path, variables, answers))
            for (const fileToCreate of createOptions.files) {
                const finalPath = path.join(createPath, applyVariables(fileToCreate.name, variables, answers))
                const filePath = path.join(path.dirname(presetFiles[i]), fileToCreate.path)
                await fs.promises.mkdir(path.dirname(finalPath), { recursive: true })
                await fs.promises.writeFile(finalPath, applyVariables((await fs.promises.readFile(filePath)).toString(), variables, answers))
            }
        }

        for (const copyOptions of copyFiles) {
            const createPath = path.join(copyOptions.packType == 'bp' ? bpPath : rpPath, applyVariables(copyOptions.path, variables, answers))
            for (const fileToCopy of copyOptions.files) {
                const finalPath = path.join(createPath, applyVariables(fileToCopy.name, variables, answers))
                const filePath = path.join(path.dirname(presetFiles[i]), fileToCopy.path)
                await fs.promises.mkdir(path.dirname(finalPath), { recursive: true })
                await fs.promises.copyFile(filePath, finalPath)
            }
        }

        for (const expandOptions of expandFiles) {
            const expandFile = path.join(expandOptions.packType == 'bp' ? bpPath : rpPath, expandOptions.path)
            const sourceFile = path.join(path.dirname(presetFiles[i]), expandOptions.file)
            await fs.promises.mkdir(path.dirname(expandFile), { recursive: true })
            if (expandOptions.type == 'json') {
                const expandContent = parse((await fs.promises.readFile(expandFile)).toString()) || {}
                const sourceContent = JSON.parse(applyVariables((await fs.promises.readFile(sourceFile)).toString(), variables, answers))
                await fs.promises.writeFile(expandFile, stringify(mergeDeep(expandContent, sourceContent), null, 4))
            } else {
                await fs.promises.appendFile(expandFile, applyVariables('\n' + (await fs.promises.readFile(sourceFile)).toString(), variables, answers))
            }
        }

        function applyVariables(inputString, variables, values) {
            variables.forEach((variable, i) => {
                inputString = inputString.replace(new RegExp(variable, 'g'), values[i])
            })
            return inputString
        }

    })

}

module.exports = { presets }