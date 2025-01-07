/*

    Organism

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v0.2.3d.js'

const organisms = [];
const maxEdges = 32;
const meshSize = 1;

class Organism {
    constructor(dnaSequence) {
        this.dnaSequence = dnaSequence;
        this.mesh = null;
        this.membraneOutline = null;

        this.createMesh();
    }
    updateTraitsFromDNA(dnaSequence) {
        this.dnaSequence = dnaSequence;
        this.createMesh();
    }
    createMesh() {
        // Create geometry
        const shape = new THREE.Shape();
        const angleStep = (2 * Math.PI) / maxEdges;

        for (let i = 0; i < maxEdges; i++) {
            const angle = i * angleStep;
            const x = Math.cos(angle) * meshSize;
            const y = Math.sin(angle) * meshSize;

            if (i === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        }
        shape.closePath();

        const extrudeSettings = {
            depth: 1,
            bevelEnabled: false
        };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshBasicMaterial({ color: 'red' });
        const newMesh = new THREE.Mesh(geometry, material);

        if (this.mesh) {
            if (this.moveStyleCache == this.traits.moveStyle) {
                newMesh.position.copy(this.mesh.position)
                newMesh.rotation.copy(this.mesh.rotation)
            }
            ThreeElements.scene.remove(this.mesh)
        }
        this.mesh = newMesh

        // Add membrane outline
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const newMembraneOutline = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        if (this.membraneOutline) {
            if (this.moveStyleCache == this.traits.moveStyle) {
                newMembraneOutline.position.copy(this.membraneOutline.position)
                newMembraneOutline.rotation.copy(this.membraneOutline.rotation)
            }
            ThreeElements.scene.remove(this.membraneOutline)
        }
        this.membraneOutline = newMembraneOutline

        ThreeElements.scene.add(this.mesh);
        ThreeElements.scene.add(this.membraneOutline);
    }
    updateMovement() {
        if (this.mesh == null || !idleAnimationsToggle) {
            return
        }
        // Rotate idly
        this.mesh.rotation.z += Math.sin(Date.now() * 0.001) * Math.random() * 0.01;
    }
}

// Main render loop
let activeAnimation = null;
let idleAnimationsToggle = false
function animate() {
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    function renderFrame() {
        organisms.forEach((organism) => {
            // Skip if no mesh yet
            if (organism.mesh == null) {
                return
            }
            organism.updateMovement()
            // Bounce off edges regardless
            if (organism.mesh.position.x > 6 || organism.mesh.position.x < -6) {
                organism.velocity.x = -organism.velocity.x;
            }
            if (organism.mesh.position.y > 3 || organism.mesh.position.y < -3) {
                organism.velocity.y = -organism.velocity.y;
            }
        });
        ThreeElements.renderScene();
        activeAnimation = requestAnimationFrame(renderFrame);
    }

    renderFrame();
}
animate()

function addOrganism(dnaSequence) {
    const newOrganism = new Organism(dnaSequence);
    organisms.push(newOrganism);
    return newOrganism
}

function setIdle(state) {
    idleAnimationsToggle = state
}

export { addOrganism, setIdle };