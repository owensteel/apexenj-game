/*

    Organism builder

    Constructs a Three JS mesh for an organism by converting
    its DNA sequence into nodes.

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v1.3d'
import DNA from './game.v1.dna';

const NODESIZE_DEFAULT = 6

// Hexagon (for builder)

function generateHexagonGeometry(zAngle = 0) {
    // Create a new shape for the hexagon
    const hexShape = new THREE.Shape();

    // Define a radius for the hexagon
    const radius = NODESIZE_DEFAULT;

    // Move to the starting point
    hexShape.moveTo(
        Math.cos(0) * radius,
        Math.sin(0) * radius
    );

    // Create each side of the hexagon
    // For basic/placeholder geometry
    const hexShapeLinePos = []
    for (let i = 1; i < 6; i++) {
        hexShapeLinePos.push({
            x: Math.cos(i * (Math.PI / 3)) * radius,
            y: Math.sin(i * (Math.PI / 3)) * radius
        });
    }

    // Draw shape path
    for (const linePos of hexShapeLinePos) {
        hexShape.lineTo(
            linePos.x,
            linePos.y
        )
    }

    // Close the path to form a proper hexagon
    hexShape.closePath();

    // Configure extrude settings (depth, no bevel, etc.)
    const extrudeSettings = {
        steps: 2,
        depth: radius,
        bevelEnabled: false
    };

    // Generate the extruded geometry
    const geom = new THREE.ExtrudeGeometry(
        hexShape,
        extrudeSettings
    );

    // Rotate geometry to face outwards (won't affect
    // mesh and children)
    geom.rotateZ(zAngle - (Math.PI / 2))

    return geom
}

// Generate positions of all appendage/root nodes in world space
// So converting the node tree into a 2D array of positions

function generateAbsoluteNodePositions(
    currentNode,
    allowDetachingParts = false,
    x = 0,
    y = 0,
    level = 0,
    positionsArray = [],
    parentNodePos = null,
    currentNodeAngle = 0
) {
    // Prevent null crash
    if (!currentNode) {
        console.warn("Null node encountered while generating positions")
        return;
    }

    if (currentNode.detach === true && !allowDetachingParts) {
        // Do not add entirety of detaching node
        return;
    }

    const currentNodePosIndex = positionsArray.length;
    const currentNodePosFinal = {
        x,
        y,
        z: 0,
        detach: currentNode.detach === true,
        node: currentNode,
        level,
        index: currentNodePosIndex,
        parentNodePos,
        mesh: null,
        angle: currentNodeAngle
    };
    positionsArray.push(currentNodePosFinal);

    // The distance from parent to child (can tweak for better spacing)
    const radius = NODESIZE_DEFAULT * 1.7;

    // For a flat-topped hex, children are spaced at 0°, 60°, 120°, 180°, 240°, 300°

    for (const edgeIndex in Object.keys(currentNode.children)) {
        const child = currentNode.children[edgeIndex]
        if (!child) continue;

        // Add parentNode and edgeOfParent to child as these
        // are references that must be refreshed
        child.parentNode = currentNode
        child.edgeOfParent = edgeIndex

        // Each of the 6 directions for a flat-top hex
        const childAngle = (edgeIndex * (Math.PI / 3)) + 1.575;

        // Convert polar to cartesian
        const childX = x + radius * Math.cos(childAngle);
        const childY = y + radius * Math.sin(childAngle);

        // Recurse
        generateAbsoluteNodePositions(
            child,
            allowDetachingParts,
            childX,
            childY,
            level + 1,
            positionsArray,
            currentNodePosFinal,
            childAngle
        );
    }

    return positionsArray;
}

// Build either a union mesh or tree of parent and child meshes
// from nodes or node positions

function buildBodyFromNodePositions(
    positions,
    allowDetachingParts = false
) {
    // Check there are nodes
    if (positions.length === 0) {
        return null;
    }

    // Init union
    let meshUnion = null;

    // For each position, build a node mesh

    positions.forEach((pos, posIndex) => {
        // Don't add detaching parts to the union
        if (pos.detach && !allowDetachingParts) {
            return
        }

        // Hexagon node
        const nodeGeom = generateHexagonGeometry(
            pos.node.block.cut,
            pos.angle
        )
        const nodeMaterial = new THREE.MeshBasicMaterial(
            {
                color: pos.node.block.color,
                dithering: true
            }
        )
        const nodeMesh = new THREE.Mesh(
            nodeGeom,
            nodeMaterial
        );
        nodeMesh.position.set(pos.x, pos.y, pos.z);

        // Required for correct placing in a union
        nodeMesh.updateMatrix();

        // Update index in case node positions array has been
        // changed between builds
        pos.index = posIndex

        // Reference to node's mesh
        pos.mesh = nodeMesh

        // Mesh's reference to node
        nodeMesh.nodePos = pos

        if (!meshUnion) {
            // First shape
            meshUnion = nodeMesh;
        } else {
            // Union with the accumulated shape
            if (pos.parentNodePos && pos.parentNodePos.mesh) {
                const parentMesh = pos.parentNodePos.mesh
                nodeMesh.position.set(
                    pos.x - pos.parentNodePos.x,
                    pos.y - pos.parentNodePos.y,
                    pos.z
                );
                parentMesh.add(nodeMesh)
            } else {
                console.warn("Could not add node mesh to a parent mesh, added to main mesh instead with global position")
                meshUnion.add(nodeMesh)
            }
        }
    });

    return meshUnion;
}

// Organism Body model

class OrganismBody {
    constructor(dnaModel) {
        if (dnaModel instanceof DNA == false) {
            throw new Error("DNA model is required for Organism Body")
        }
        this.dnaModel = dnaModel

        // Will be initialised on first build
        this.mesh = null
        this.nodePositions = []
        this.nodePosByBlockTypeCache = {}

        // Build options
        this.buildDetachingParts = true

        // Init body
        this.rebuild()
    }
    updateDna(newDnaModel) {
        if (newDnaModel instanceof DNA == false) {
            throw new Error("DNA model is required for Organism Body")
        }
        this.dnaModel = newDnaModel

        // Rebuild new body with new DNA
        this.rebuild()
    }
    updateNodePosByBlockTypeCache() {
        // Update cache of blocks by type, e.g motor blocks

        // Clear old cache
        this.nodePosByBlockTypeCache = {}

        // Populate new cache
        for (const nodePos of this.nodePositions) {
            const typeName = nodePos.node.block.typeName
            if (!(typeName in this.nodePosByBlockTypeCache)) {
                this.nodePosByBlockTypeCache[typeName] = []
            }
            this.nodePosByBlockTypeCache[typeName].push(nodePos)
        }

        return this.nodePosByBlockTypeCache
    }
    rebuild() {
        // Update node positions
        this.nodePositions = generateAbsoluteNodePositions(
            this.dnaModel,
            this.buildDetachingParts
        )

        // Create new mesh
        const newMesh = buildBodyFromNodePositions(
            this.nodePositions,
            this.buildDetachingParts
        )
        if (!this.mesh) {
            // Initialise mesh
            this.mesh = newMesh
        } else {
            // Modify existing mesh in-place so that we
            // don't have to remove the old mesh and add
            // the new one

            // Clear current mesh children, since the root node
            // never changes
            this.mesh.children.forEach((oldChild) => {
                this.mesh.remove(oldChild)
            })
            // Add new children
            newMesh.children.forEach((newChild) => {
                this.mesh.add(newChild)
            })
        }

        // Update cached info about body
        this.updateNodePosByBlockTypeCache()
    }
    updateNodePosWorldPositions() {
        if (!this.mesh || this.nodePositions.length < 1) {
            return false
        }

        this.mesh.updateMatrixWorld(true);
        for (const nodePos of this.nodePositions) {
            nodePos.worldPos = ThreeElements.convertNodePosIntoWorldPos(
                nodePos, this.mesh
            )
        }

        return this.nodePositions
    }
}

export default OrganismBody