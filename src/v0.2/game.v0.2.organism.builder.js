/*

    Organism builder

    Constructs a Three JS mesh for an organism by converting
    its DNA sequence into nodes.

*/

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { cloneObject } from "./game.v0.2.utils";
import { enforceSymmetry } from './game.v0.2.dna';

const nodeMeshSize = 1;
const defaultSpread = 1.25;

const shrinkingChildrenFlag = false;
const maxLevel = 10
const levelToSizePerc = (level) => {
    if (!shrinkingChildrenFlag) {
        return 1
    }
    return Math.max(0.1, (1 - (level / maxLevel)))
}

// Recursively collect positions of all appendage/root nodes

function gatherNodePositions(
    currentNode,
    allowDetachingParts = false,
    x = 0,
    y = 0,
    level = 0,
    angleStart = Math.PI,
    angleEnd = -Math.PI,
    positionsArray = [],
    parentNodePos = null,
    currentNodeAngle = 0
) {
    // Prevent null crash
    if (!currentNode) {
        return
    }

    // If node is "appendage" or "root", record its position
    if (currentNode.role !== "appendage" && currentNode.role !== "root") {
        // Cannot be added to union
        return
    }

    // Create directional symmetry 
    if (enforceSymmetry && currentNode.role == "root") {
        // Clone root node before editing or it will affect
        // original sequence
        const newRootNode = {
            role: "root",
            block: currentNode.block,
            offshoots: []
        }
        // Duplicate its single offshoot (there is only one
        // allowed) 4 times for symmetry
        for (let dirI = 0; dirI < 4; dirI++) {
            // Individual clone for each offshoot
            const rootNodeClone = cloneObject(currentNode)
            newRootNode.offshoots.push(rootNodeClone.offshoots[0])
        }
        currentNode = newRootNode;
    }

    if (currentNode.detach == true && !allowDetachingParts) {
        // Do not add entirety of detaching node
        return
    }

    const currentNodePosIndex = positionsArray.length
    const currentNodePosFinal = {
        x,
        y,
        z: 0,
        detach: (currentNode.detach == true),
        node: currentNode,
        level,
        index: currentNodePosIndex,
        parentNodePos,
        mesh: null,
        angle: currentNodeAngle
    }
    positionsArray.push(currentNodePosFinal);

    // The distance from parent to child (radius).
    const radius = defaultSpread * levelToSizePerc(level);

    // If there are children, distribute them radially
    if (currentNode.offshoots && currentNode.offshoots.length > 0) {
        const childCount = currentNode.offshoots.length;
        const angleSlice = (angleEnd - angleStart) / childCount;

        for (let i = 0; i < childCount; i++) {
            const child = currentNode.offshoots[i];
            const childAngle = angleStart + angleSlice * (i + 0.5);

            // Convert polar to cartesian
            const childX = x + radius * Math.cos(childAngle);
            const childY = y + radius * Math.sin(childAngle);

            const subAngleStart = angleStart + angleSlice * i;
            const subAngleEnd = angleStart + angleSlice * (i + 1);

            gatherNodePositions(
                child,
                allowDetachingParts,
                childX,
                childY,
                level + 1,
                subAngleStart,
                subAngleEnd,
                positionsArray,
                currentNodePosFinal,
                childAngle
            );
        }
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

    // For each position, build a sphere mesh

    positions.forEach((pos) => {
        // Don't add detaching parts to the union
        if (pos.detach && !allowDetachingParts) {
            return
        }

        const sphereGeom = new THREE.SphereGeometry(
            nodeMeshSize,
            4,
            4
        );
        const sphereMaterial = new THREE.MeshBasicMaterial(
            {
                color: pos.node.block.color
            }
        )
        meshMaterials.push(sphereMaterial)
        const sphereMesh = new THREE.Mesh(
            sphereGeom,
            sphereMaterial
        );
        sphereMesh.position.set(pos.x, pos.y, pos.z);

        // Child nodes reduce in size
        sphereMesh.scale.x = levelToSizePerc(pos.level)
        sphereMesh.scale.y = levelToSizePerc(pos.level)

        // Required for correct placing in a union
        sphereMesh.updateMatrix();

        // Reference to node's mesh
        pos.mesh = sphereMesh

        if (!meshUnion) {
            // First shape
            if (formUnionMesh) {
                meshUnion = CSG.fromMesh(sphereMesh)
            } else {
                meshUnion = sphereMesh;
            }
        } else {
            // Union with the accumulated shape
            if (formUnionMesh) {
                meshUnion = meshUnion.union(CSG.fromMesh(sphereMesh));
            } else {
                if (pos.parentNodePos && pos.parentNodePos.mesh) {
                    const parentMesh = pos.parentNodePos.mesh
                    sphereMesh.position.set(
                        pos.x - pos.parentNodePos.x,
                        pos.y - pos.parentNodePos.y,
                        pos.z
                    );
                    parentMesh.add(sphereMesh)
                } else {
                    console.warn("Could not add node mesh to a parent mesh, added to main mesh instead with global position")
                    meshUnion.add(sphereMesh)
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

function buildSeamlessBodyFromNodes(rootNodeUncloned, allowDetachingParts = false, formUnionMesh = false) {
    console.log("building body...", { formUnionMesh })

    // Clone to prevent detachment caching from entering original input
    const rootNodeClone = cloneObject(rootNodeUncloned)

    // Collect all node positions
    const organismNodePositions = gatherNodePositions(rootNodeClone, allowDetachingParts)

    // Build
    return buildBodyFromNodePositions(
        organismNodePositions,
        allowDetachingParts,
        formUnionMesh
    )
}

export {
    buildSeamlessBodyFromNodes,
    gatherNodePositions,
    buildBodyFromNodePositions,
    nodeMeshSize
}