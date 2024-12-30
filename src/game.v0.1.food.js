/*

    Food

*/

import * as THREE from 'three';
import * as ThreeElements from './game.v0.1.3d.js'

class Food {
    constructor() {
        // Placeholder mesh
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xffe135 })
        );
        // Placeholder outline
        this.meshOutline = new THREE.LineSegments(
            new THREE.EdgesGeometry(this.mesh.geometry),
            new THREE.LineBasicMaterial({ color: 0xFF4235 })
        );

        this.isEaten = false;
        this.strength = 75;

        this.animate();
        this.loadModel();
    }
    async loadModel() {
        // Mesh
        const bananaObj = await ThreeElements.loadModel('/assets/3d/Banana_01.obj') // Static URI
        this.mesh.geometry = bananaObj.children[0].geometry;

        // Outline
        this.meshOutline.geometry = new THREE.EdgesGeometry(this.mesh.geometry);

        // Scaling
        this.mesh.scale.x = 0.015
        this.mesh.scale.y = 0.01
        this.mesh.scale.z = 0.01
        this.meshOutline.scale.x = 0.015
        this.meshOutline.scale.y = 0.01
        this.meshOutline.scale.z = 0.01
    }
    animate() {
        // For some reason doesn't work unless cycle is isolated
        const animateCycle = () => {
            requestAnimationFrame(animateCycle);
            this.mesh.rotation.y += 0.02;
            this.mesh.rotation.z += 0.02;
            this.meshOutline.rotation.copy(this.mesh.rotation)
        }
        animateCycle()
    }
    addToStage() {
        ThreeElements.scene.add(this.mesh)
        ThreeElements.scene.add(this.meshOutline)
    }
    removeFromStage() {
        ThreeElements.scene.remove(this.mesh)
        ThreeElements.scene.remove(this.meshOutline)
    }
    move(posToAvoid = []) {
        // Define potential spawn locations
        const cornersAndCenter = [
            { x: -6, y: -3 }, // Bottom-left corner
            { x: -6, y: 3 },  // Top-left corner
            { x: 6, y: -3 },  // Bottom-right corner
            { x: 6, y: 3 },   // Top-right corner
            { x: 0, y: 0 }    // Center
        ];

        // Helper function to calculate distance between two points
        function calculateDistance(point1, point2) {
            const dx = point1.x - point2.x;
            const dy = point1.y - point2.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        // Find the location that is furthest away from all organisms
        let bestLocation = null;
        let maxDistance = -Infinity;

        cornersAndCenter.forEach((location) => {
            // Calculate the minimum distance to any organism for this location
            const minDistanceToOrg = posToAvoid.reduce((minDistance, orgPos) => {
                const distance = calculateDistance(location, orgPos);
                return Math.min(minDistance, distance);
            }, Infinity);

            // Update best location if this one is further away
            if (minDistanceToOrg > maxDistance) {
                maxDistance = minDistanceToOrg;
                bestLocation = location;
            }
        });

        this.mesh.position.x = bestLocation.x
        this.mesh.position.y = bestLocation.y

        this.meshOutline.position.copy(this.mesh.position)
    }
    appear(playerPos, enemyPos) {
        this.isEaten = false;
        this.move([playerPos, enemyPos]);
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