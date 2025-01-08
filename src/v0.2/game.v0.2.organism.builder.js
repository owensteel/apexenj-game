/*

    Organism builder

*/

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

const defaultMeshSize = 1;
const defaultSpread = 1.5;
const defaultSphereSegments = 4;

// Recursively collect positions of all appendage/root nodes

function gatherNodePositions(
    currentNode,
    allowDetachingParts = false,
    x = 0,
    y = 0,
    level = 0,
    angleStart = -Math.PI,
    angleEnd = Math.PI,
    positionsArray = []
) {
    // If node is "appendage" or "root", record its position
    if (currentNode.role !== "appendage" && currentNode.role !== "root") {
        // Cannot be added to union
        return
    }

    if (currentNode.detach == true && !allowDetachingParts) {
        // Do not add entirety of detaching node
        return
    }

    positionsArray.push({ x, y, z: 0, detach: (currentNode.detach == true), node: currentNode });

    // If there are children, distribute them radially
    if (currentNode.offshoots && currentNode.offshoots.length > 0) {
        const childCount = currentNode.offshoots.length;
        const angleSlice = (angleEnd - angleStart) / childCount;

        for (let i = 0; i < childCount; i++) {
            const child = currentNode.offshoots[i];
            const childAngle = angleStart + angleSlice * (i + 0.5);

            // Convert polar to cartesian
            const childX = x + defaultSpread * Math.cos(childAngle);
            const childY = y + defaultSpread * Math.sin(childAngle);

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
                positionsArray
            );
        }
    }

    return positionsArray;
}

function buildSeamlessBodyFromNodes(rootNodeUncloned, allowDetachingParts = false) {
    // Clone to prevent detachment caching from entering original input
    const rootNode = JSON.parse(JSON.stringify(rootNodeUncloned))

    console.log(rootNode)

    // Collect all node positions
    const positions = gatherNodePositions(rootNode, allowDetachingParts);

    if (positions.length === 0) {
        // No appendage/root nodes
        return null;
    }

    // Clear union
    let csgUnion = null;

    // For each position, build a sphere mesh
    // Then union it into a "running" CSG object

    positions.forEach((pos) => {
        // Don't add detaching parts to the union
        if (pos.detach && !allowDetachingParts) {
            return
        }

        const sphereGeom = new THREE.SphereGeometry(
            defaultMeshSize,
            defaultSphereSegments,
            defaultSphereSegments
        );
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
        sphereMesh.position.set(pos.x, pos.y, pos.z);
        sphereMesh.scale.z = 0.5

        // Convert sphere to a CSG
        sphereMesh.updateMatrix();
        const sphereCSG = CSG.fromMesh(sphereMesh);

        if (!csgUnion) {
            // First shape
            csgUnion = sphereCSG;
        } else {
            // Union with the accumulated shape
            csgUnion = csgUnion.union(sphereCSG);
        }
    });

    // Convert final CSG back to a Three.js mesh
    const finalMesh = CSG.toMesh(
        csgUnion,
        new THREE.Matrix4(),
        new THREE.MeshNormalMaterial()
    );

    return finalMesh;
}

export { buildSeamlessBodyFromNodes, gatherNodePositions }