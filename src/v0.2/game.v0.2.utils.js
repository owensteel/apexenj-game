/*

    Generic utils

*/

function cloneObject(obj = {}) {
    return JSON.parse(JSON.stringify(obj))
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