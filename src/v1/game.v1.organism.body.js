/*

    Organism Body

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v1.3d'
import DNA from './game.v1.dna';
import { NODESIZE_DEFAULT } from './game.v1.references'

// Hexagon (for builder)

function generateHexagonGeometry(
    nodeSize = NODESIZE_DEFAULT,
    zAngle = 0
) {
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
            pos.nodeSize,
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
        this.nodePositions = ThreeElements.generateAbsoluteNodePositions(
            NODESIZE_DEFAULT,
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