/*

    Generic utils

*/

function cloneObject(obj = {}) {
    return JSON.parse(JSON.stringify(obj))
}

export { cloneObject }