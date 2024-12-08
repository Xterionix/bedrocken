const fs = require('fs');

async function exists(path) {
    try {
        await fs.promises.access(path)
        return true
    } catch (error) {
        return false
    }
}

function mergeDeep(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            mergeDeep(target[key], source[key]);
        } else if (Array.isArray(source[key])) {
            if (!target[key]) target[key] = [];
            target[key] = target[key].concat(source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

function valueFromJsonPath(path, object) {
    if (!(path instanceof Array)) throw new TypeError("Expected an array. Did not receive an array")
    return path.reduce((acc, key) => acc && acc[key], object)
}

module.exports = { exists, mergeDeep, valueFromJsonPath }