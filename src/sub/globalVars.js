const data = {
    bpPath: '',
    rpPath: ''
}

function getBpPath() {
    return data.bpPath
}

function setBpPath(newPath) {
    return data.bpPath = newPath
}

function getRpPath() {
    return data.rpPath
}

function setRpPath(newPath) {
    return data.rpPath = newPath
}

module.exports = { getBpPath, getRpPath, setBpPath, setRpPath }