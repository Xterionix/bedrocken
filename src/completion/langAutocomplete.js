const { CacheSystem } = require('../sub/cacheSystem');

const vscode = require('vscode');

/**
 * @param {CacheSystem} system
 */
function createLangProvider(system) {
    return vscode.languages.registerCompletionItemProvider(
        [
            { scheme: 'file', language: 'bc-minecraft-language' },
            { scheme: 'file', language: 'plaintext' }
        ], {
        provideCompletionItems(document, position) {

            const suggestions = []
            const line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).replace('.name', '')

            if (!document.fileName.endsWith('.lang')) return;

            if (line.includes('=')) {
                let completion;

                if (line.startsWith('action.hint.exit.')) completion = 'Press :_input_key.sneak: to Dismount'
                else completion = line.split('=')[0].split(':').pop().split('.').pop().split('_').map(str => str[0].toUpperCase() + str.slice(1)).join(' ')

                if (line.startsWith('item.spawn_egg')) completion = completion + ' Spawn Egg'

                completion = new vscode.CompletionItem(completion, vscode.CompletionItemKind.EnumMember)
                completion.sortText = '0'
                return [completion]
            }

            const text = document.getText().split('\n');

            system.getCache().entity.ids.forEach(id => {
                if (!text.some(x => x.startsWith(`entity.${id}.name=`))) suggestions.push(new vscode.CompletionItem(`entity.${id}.name`, vscode.CompletionItemKind.Class))
            })
            system.getCache().entity.spawnable_ids.forEach(id => {
                if (!text.some(x => x.startsWith(`item.spawn_egg.entity.${id}.name=`))) suggestions.push(new vscode.CompletionItem(`item.spawn_egg.entity.${id}.name`, vscode.CompletionItemKind.Class))
            })
            system.getCache().entity.rideable_ids.forEach(id => {
                if (!text.some(x => x.startsWith(`action.hint.exit.${id}=`))) suggestions.push(new vscode.CompletionItem(`action.hint.exit.${id}`, vscode.CompletionItemKind.Class))
            })
            const itemIds = system.getCache().item.ids;
            itemIds.forEach(id => {
                if (!text.some(x => x.startsWith(`item.${id}=`))) suggestions.push(new vscode.CompletionItem(`item.${id}`, vscode.CompletionItemKind.Class))
            })
            system.getCache().block.ids.filter(id => !itemIds.includes(id)).forEach(id => {
                if (!text.some(x => x.startsWith(`tile.${id}=`))) suggestions.push(new vscode.CompletionItem(`tile.${id}.name`, vscode.CompletionItemKind.Class))
            })
            system.getCache().texts.forEach(id => {
                if (!text.some(x => x.startsWith(`${id}=`)) && !system.getVanillaData().texts.includes(id)) suggestions.push(new vscode.CompletionItem(id, vscode.CompletionItemKind.Enum))
            })
            system.getCache().groups.forEach(id => {
                if (!text.some(x => x.startsWith(`${id}=`))) suggestions.push(new vscode.CompletionItem(id, vscode.CompletionItemKind.Class))
            })
            return suggestions
        }
    })
}

vscode.workspace.onDidChangeTextDocument(event => {
    if (!event.document.fileName.endsWith('.lang')) return;
    if (event.contentChanges.some(x => x.text.includes('='))) vscode.commands.executeCommand('editor.action.triggerSuggest');
})

module.exports = { createLangProvider }