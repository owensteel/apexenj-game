/*

    Generic utils

    Provides utilities to be used globally.

*/

function cloneObject(obj = {}, shallow = true) {
    if (shallow) {
        const clone = {}
        for (const key of Object.keys(obj)) {
            clone[key] = obj[key]
        }
        return clone
    } else {
        return JSON.parse(JSON.stringify(obj))
    }
}

function getGlobalBoundingBoxOfHTMLElement(element) {
    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Calculate the global position (absolute position)
    const globalRect = {
        top: rect.top + scrollY,
        left: rect.left + scrollX,
        right: rect.right + scrollX,
        bottom: rect.bottom + scrollY,
        width: rect.width,
        height: rect.height
    };

    return globalRect;
}

export { cloneObject, getGlobalBoundingBoxOfHTMLElement }