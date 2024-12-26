const vscode = require('vscode');

/**
 * @typedef Question
 * @property {'text'|'integer'|'float'|'radio'|'checkbox'} type
 * @property {string} label
 * @property {string} description
 * @property {string[]|undefined} options
 */

class Form {
    /**
     * Creates a form
     * @param {Question[]} questions 
     */
    constructor(questions) {
        this.questions = questions || [];
    }
    async show() {
        let answers = [];
        for (let i = 0; i < this.questions.length; i++) {
            const question = this.questions[i];
            switch (question.type) {
                case 'text':
                    answers[i] = await vscode.window.showInputBox({ prompt: question.label, placeHolder: question.description });
                    if (!answers[i]) return; break;
                case 'integer':
                    answers[i] = parseInt(await vscode.window.showInputBox({ prompt: question.label, placeHolder: question.description, validateInput: (s) => { return Number.isNaN(parseInt(s)) ? 'Please enter a valid integer' : undefined } }));
                    if (Number.isNaN(answers[i])) return; break;
                case 'float':
                    answers[i] = parseFloat(await vscode.window.showInputBox({ prompt: question.label, placeHolder: question.description, validateInput: (s) => { return Number.isNaN(parseFloat(s)) ? 'Please enter a valid decimal' : undefined } }));
                    if (Number.isNaN(answers[i])) return; break;
                case 'radio':
                    answers[i] = await vscode.window.showQuickPick(question.options, { title: question.label, placeHolder: question.description });
                    if (answers[i] == undefined) return; break;
                case 'checkbox':
                    answers[i] = (await vscode.window.showQuickPick(question.options, { title: question.label, placeHolder: question.description, canPickMany: true })).join(',');
                    if (answers[i] == undefined) return; break;
                default:
                    throw new Error('Invalid question type ' + question.type + ' received')
            }
        }
        return answers;
    }
}

module.exports = { Form }