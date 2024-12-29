/*

    Food

*/

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import * as ThreeElements from './game.v0.1.3d.js'

function loadBananaModel() {
    // Create a loader
    const loader = new OBJLoader()

    // Load the OBJ file
    loader.load(
        './assets/3d/Banana_01.obj',
        obj => {
            // Access the loaded geometry and material
            const originalGeometry = obj.children[0].geometry
        },
        xhr => {
            // Progress callback
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        error => {
            // Error callback
            console.error('Error loading OBJ:', error)
        }
    )
}

class Food {
    constructor() {
        const bananaShape = [];
        const radius = 0.01; // Thickness of the banana
        const length = 1; // Length of the banana

        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const x = radius + Math.sin(t * Math.PI) * 0.4; // Slight bulge along the curve
            const y = t * length - length / 2; // Length from top to bottom
            bananaShape.push(new THREE.Vector2(x, y));
        }

        const latheGeometry = new THREE.LatheGeometry(bananaShape, 32);

        // Material for the banana
        const bananaMaterial = new THREE.MeshBasicMaterial({ color: 0xffe135 }); // Yellow
        const bananaMesh = new THREE.Mesh(latheGeometry, bananaMaterial);

        // Bend the banana using Matrix4
        const bendAmount = Math.PI / 6; // How much the banana should curve
        bananaMesh.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -length / 2, 0)); // Move pivot to the center
        bananaMesh.geometry.applyMatrix4(new THREE.Matrix4().makeRotationZ(bendAmount)); // Bend along the Z-axis
        bananaMesh.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, length / 2, 0)); // Reset pivot

        // Outline
        const edgesGeometry = new THREE.EdgesGeometry(bananaMesh.geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const meshOutline = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        this.mesh = bananaMesh;
        this.meshOutline = meshOutline;
        this.isEaten = false;
        this.animate();
    }
    animate() {
        // For some reason doesn't work unless cycle is isolated
        const animateCycle = () => {
            requestAnimationFrame(animateCycle);
            this.mesh.rotation.y += 0.01;
            this.meshOutline.rotation.copy(this.mesh.rotation)
        }
        animateCycle()
    }
    addToStage() {
        ThreeElements.scene.add(this.mesh)
    }
    removeFromStage() {
        ThreeElements.scene.remove(this.mesh)
    }
    move() {
        const maxX = 6
        const maxY = 3

        this.mesh.position.x = maxX - (Math.random() * (maxX * 2))
        this.mesh.position.y = maxY - (Math.random() * (maxY * 2))

        this.meshOutline.position.copy(this.mesh.position)
    }
    appear() {
        this.isEaten = false;
        this.move();
        this.addToStage();
    }
    eat() {
        this.isEaten = true;
        this.removeFromStage();
    }
}

// Create food
function createFood() {
    return new Food();
}

export { createFood }