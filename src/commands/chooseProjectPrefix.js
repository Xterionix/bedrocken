const { Form } = require('../sub/form');
const vscode = require('vscode');

const prefixForm = new Form([{ label: 'Project Prefix', description: 'project_prefix: <-', type: 'text' }])

async function chooseProjectPrefix() {

    //TODO: Add syncing between installs
    const value = (await prefixForm.show())[0]
    vscode.workspace.getConfiguration('bedrocken').update('projectPrefix', value, vscode.ConfigurationTarget.Workspace)
    vscode.window.setStatusBarMessage('Project prefix set to ' + value, 2000)

}

module.exports = { chooseProjectPrefix }