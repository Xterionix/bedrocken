const vscode = require('vscode');

function chooseProjectPrefix() {

    vscode.window.showInputBox({ title: 'Project Prefix' }).then(value => {
        vscode.workspace.getConfiguration('bedrocken').update('project_prefix', value, vscode.ConfigurationTarget.Workspace)
        vscode.window.setStatusBarMessage('Project prefix set to ' + value, 2000)
    })

}

module.exports = { chooseProjectPrefix }