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

function rotateMeshToTarget(mesh, nx, ny, targetX, targetY) {
    // 1) localAngle: The angle from the mesh's origin to the node in local space
    const localAngle = Math.atan2(ny, nx);

    // 2) node's current world coords (assuming no prior rotation on mesh)
    //    If the mesh is at mesh.position.x, mesh.position.y:
    const nodeWorldX = mesh.position.x + nx;
    const nodeWorldY = mesh.position.y + ny;

    // 3) angle from the node's world position to the target
    const targetAngle = Math.atan2(targetY - nodeWorldY, targetX - nodeWorldX);

    // 4) the rotation needed so node points at the target
    const deltaTheta = targetAngle - localAngle;

    // Set the mesh's Z rotation in radians
    if (!isNaN(deltaTheta)) {
        mesh.rotation.z = deltaTheta;
    }
}

export { cloneObject, getGlobalBoundingBoxOfHTMLElement, rotateMeshToTarget }