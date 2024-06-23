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
}

module.exports = { createLangProvider }