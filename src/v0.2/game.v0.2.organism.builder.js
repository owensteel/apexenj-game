/*

    Organism builder

    Constructs a Three JS mesh for an organism by converting
    its DNA sequence into nodes.

*/

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { builderUiToggled } from './game.v0.2.organism.builder.ui';
import { BLOCK_TYPENAME_DEFAULT } from './game.v0.2.blocks';

const NODESIZE_DEFAULT = 9
const NODESIZE_BUILDER = 14

let nodeSize = NODESIZE_DEFAULT;
const nodeDepth = 5;

// Hexagon (for builder)

function generateHexagonGeometry() {
    // Create a new shape for the hexagon
    const hexShape = new THREE.Shape();

    // Define a radius for the hexagon
    const radius = nodeSize;

    // Move to the starting point
    hexShape.moveTo(
        Math.cos(0) * radius,
        Math.sin(0) * radius
    );

    // Create each side of the hexagon
    for (let i = 1; i < 6; i++) {
        hexShape.lineTo(
            Math.cos(i * (Math.PI / 3)) * radius,
            Math.sin(i * (Math.PI / 3)) * radius
        );
    }

    // Close the path to form a proper hexagon
    hexShape.closePath();

    // Configure extrude settings (depth, no bevel, etc.)
    const extrudeSettings = {
        steps: 1,
        depth: nodeDepth,
        bevelEnabled: false
    };

    // Generate the extruded geometry
    return new THREE.ExtrudeGeometry(hexShape, extrudeSettings);
}

// Sphere

function generateSphereGeometry() {
    return new THREE.SphereGeometry(
        nodeSize * 1.1,
        6,
        6
    )
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
    // Set node size

    nodeSize = builderUiToggled ? NODESIZE_BUILDER : NODESIZE_DEFAULT

    // Prevent null crash
    if (!currentNode) {
        console.warn("Null node encountered while generating positions")
        return;
    }

    // If node is "appendage" or "root", record its position
    if (currentNode.role !== "appendage" && currentNode.role !== "root") {
        // Cannot be added to union
        return;
    }

    if (currentNode.detach === true && !allowDetachingParts) {
        // Do not add entirety of detaching node
        return;
    }

    if (currentNode.builderUIBeingDragged) {
        // For UI effect where node appears "picked up"
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

    // The distance from parent to child (you can tweak for better spacing)
    const radius = nodeSize * 1.7;

    // For a flat-topped hex, children are spaced at 0°, 60°, 120°, 180°, 240°, 300°

    for (const edgeIndex in Object.keys(currentNode.edges)) {
        const child = currentNode.edges[edgeIndex]
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

function buildBodyFromNodePositions(positions, allowDetachingParts = false, formUnionMesh = false) {
    if (positions.length === 0) {
        // No appendage/root nodes
        return null;
    }

    // Clear union
    let meshUnion = null;
    const meshMaterials = [];

    // For each position, build a node mesh

    positions.forEach((pos, posIndex) => {
        // Don't add detaching parts to the union
        if (pos.detach && !allowDetachingParts) {
            return
        }

        const nodeGeom = builderUiToggled ? generateHexagonGeometry() : generateSphereGeometry()
        const nodeMaterial = builderUiToggled ?
            // No shading
            new THREE.MeshBasicMaterial(
                {
                    color: pos.node.block.color,
                    dithering: true,
                    // Set default blocks to invisible
                    opacity: 0,
                    transparent: pos.node.block.typeName == BLOCK_TYPENAME_DEFAULT
                }
            ) :
            // Shading
            new THREE.MeshToonMaterial(
                {
                    color: pos.node.block.color,
                    dithering: true,
                    // Set default blocks to invisible
                    opacity: 0,
                    transparent: pos.node.block.typeName == BLOCK_TYPENAME_DEFAULT
                }
            )
        meshMaterials.push(nodeMaterial)

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
            if (formUnionMesh) {
                meshUnion = CSG.fromMesh(nodeMesh)
            } else {
                meshUnion = nodeMesh;
            }
        } else {
            // Union with the accumulated shape
            if (formUnionMesh) {
                meshUnion = meshUnion.union(CSG.fromMesh(nodeMesh));
            } else {
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
        }
    });

    if (formUnionMesh) {
        meshUnion = CSG.toMesh(
            meshUnion,
            new THREE.Matrix4(),
            meshMaterials
        );

    }

    return meshUnion;
}

export {
    generateAbsoluteNodePositions,
    buildBodyFromNodePositions,
    nodeSize,
    NODESIZE_BUILDER
}