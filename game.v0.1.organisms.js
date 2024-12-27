/*

    Organisms Renderer

*/

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';

const gameWrapper = document.getElementById("game-wrapper");

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 600 / 300, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 0);
renderer.setSize(600, 300);
gameWrapper.appendChild(renderer.domElement);

// Shared variables
let organisms = []; // Array to hold all organisms
let activeAnimation = null;
const gravity = 0.025;

// Organism class
class Organism {
    constructor(dnaSequence) {
        this.id = String(Math.random()).split(".")[1]
        this.moveStyleCache = null;
        this.dnaSequence = dnaSequence;
        this.traits = this.updateTraitsFromDNA(dnaSequence);
        this.mesh = null;
        this.membraneOutline = null;
        this.velocity = { x: 0.01, y: 0 }; // Default velocity
        this.eyeAnimations = [];
        this.animationsInProgress = {
            hurt: false,
            explode: false
        }
        this.createOrganismMesh();
    }

    // Update traits from DNA
    updateTraitsFromDNA(dnaSequence) {
        const traits = {
            color: 0x00ff00, // Default color
            edges: 3,        // Minimum edges
            size: 1,         // Default size
            spikiness: 1,    // Default spikiness
            moveStyle: "float",
            membrane: 1,     // Default membrane thickness
            eyes: 1,          // Default number of eyes
            aggression: 50,
            courage: 75,
            energyConsumption: 1,
            gravityResistance: "medium"
        };

        dnaSequence.forEach((gene) => {
            switch (gene.role.title) {
                case "color":
                    traits.color = gene.role.values[gene.current];
                    break;
                case "edges":
                    traits.edges = gene.role.values[gene.current];
                    break;
                case "move-style":
                    traits.moveStyle = gene.role.values[gene.current];
                    break;
                case "membrane":
                    traits.membrane = gene.current / 100;
                    break;
                case "size":
                    traits.size = gene.role.values[gene.current];
                    break;
                case "spiky-ness":
                    traits.spikiness = gene.current / 100;
                    break;
                case "eyes":
                    traits.eyes = Math.max(1, gene.current + 1);
                    break;
                case "aggression":
                    traits.aggression = gene.current;
                    break;
                case "courage":
                    traits.courage = gene.current;
                    break;
                case "energy-consumption":
                    traits.energyConsumption = gene.role.values[gene.current];
                    break;
                case "gravity resistance":
                    traits.gravityResistance = gene.current;
                    break;
            }
        });

        this.traits = traits
        if (this.moveStyleCache == null) {
            this.moveStyleCache = traits.moveStyle
        }

        return traits
    }

    // Create the organism mesh
    createOrganismMesh() {
        // Create geometry
        const shape = new THREE.Shape();
        const angleStep = (2 * Math.PI) / Math.max(3, this.traits.edges);

        for (let i = 0; i < this.traits.edges; i++) {
            const angle = i * angleStep;
            const spikeFactor = 1 - this.traits.spikiness * (i % 2 === 0 ? 0.5 : 0.75);
            const x = Math.cos(angle) * Math.max(0.1, this.traits.size) * spikeFactor;
            const y = Math.sin(angle) * Math.max(0.1, this.traits.size) * spikeFactor;

            if (i === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        }
        shape.closePath();

        const extrudeSettings = {
            depth: this.traits.membrane,
            bevelEnabled: false
        };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshBasicMaterial({ color: this.traits.color });
        const newMesh = new THREE.Mesh(geometry, material);

        if (this.mesh) {
            if (this.moveStyleCache == this.traits.moveStyle) {
                newMesh.position.copy(this.mesh.position)
                newMesh.rotation.copy(this.mesh.rotation)
            }
            scene.remove(this.mesh)
        }
        this.mesh = newMesh

        // Add eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05 * this.traits.size, 16, 16);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        this.eyeAnimations.forEach((cycle) => {
            clearInterval(cycle)
        })

        for (let i = 0; i < this.traits.eyes; i++) {
            const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);

            const angle = (2 * Math.PI / this.traits.eyes) * i;
            const spikeFactor = 1 - this.traits.spikiness * (i % 2 === 0 ? 0.5 : 0.75);
            const x = Math.cos(angle) * (0.4 * spikeFactor) * this.traits.size;
            const y = Math.sin(angle) * (0.4 * spikeFactor) * this.traits.size;

            eyeMesh.position.set(x, y, this.traits.membrane);
            this.mesh.add(eyeMesh);

            const blinkAnimation = () => {
                eyeMesh.scale.y = 0.1;
                setTimeout(() => {
                    eyeMesh.scale.y = 1;
                }, (1000 / 12) * 3);
            };

            setTimeout(() => {
                blinkAnimation();
                const blinkAnimationCycle = setInterval(blinkAnimation, 5000);
                this.eyeAnimations.push(blinkAnimationCycle);
            }, 1000 * Math.random());
        }

        // Add membrane outline
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const newMembraneOutline = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        if (this.membraneOutline) {
            if (this.moveStyleCache == this.traits.moveStyle) {
                newMembraneOutline.position.copy(this.membraneOutline.position)
                newMembraneOutline.rotation.copy(this.membraneOutline.rotation)
            }
            scene.remove(this.membraneOutline)
        }
        this.membraneOutline = newMembraneOutline

        scene.add(this.mesh);
        scene.add(this.membraneOutline);

        this.moveStyleCache = this.traits.moveStyle;
    }

    // Update movement logic
    updateMovement() {
        const organismSpeed = (this.traits.energyConsumption / 100) * 0.02

        if (this.traits.moveStyle === "float") {
            if (idleAnimationsToggle) {
                this.mesh.position.y += Math.sin(Date.now() * 0.001) * organismSpeed;
            }
        } else if (this.traits.moveStyle === "tail") {
            if (idleAnimationsToggle) {
                this.mesh.position.x += this.velocity.x * (organismSpeed / 0.02);
                this.mesh.position.y += Math.sin(Date.now() * 0.002) * organismSpeed;
            }
        } else if (this.traits.moveStyle === "legs") {
            this.velocity.y += gravity;
            this.mesh.position.y -= this.velocity.y;

            if (this.mesh.position.y < -3) {
                this.velocity.y *= -0.8;
                this.mesh.position.y = -3;
            }
        }

        this.membraneOutline.position.copy(this.mesh.position);
        this.membraneOutline.rotation.copy(this.mesh.rotation);

        // Rotate idly
        this.mesh.rotation.z += Math.sin(Date.now() * 0.001) * (this.traits.moveStyle === "legs" ? 0 : Math.random() * 0.01);
    }

    // Hurting animation
    hurt() {
        if (this.animationsInProgress.hurt) {
            return
        }

        this.animationsInProgress.hurt = true
        const cachedMaterial = this.membraneOutline.material

        this.mesh.scale.x -= 0.1
        this.mesh.scale.y -= 0.1
        this.membraneOutline.material = new THREE.LineBasicMaterial({ color: 0xFF0000 });

        setTimeout(() => {
            this.mesh.scale.x += 0.1
            this.mesh.scale.y += 0.1
            this.membraneOutline.material = cachedMaterial
            setTimeout(() => {
                this.animationsInProgress.hurt = false
            }, 125)
        }, 125)
    }

    // Explode!
    explode() {
        if (this.animationsInProgress.explode) {
            return
        }

        this.animationsInProgress.explode = true

        // Reset appearance first
        this.createOrganismMesh()

        const cachedMaterial = this.mesh.material
        let aniCycle;
        aniCycle = setInterval(() => {
            this.mesh.scale.x -= Math.random() / 10
            this.mesh.scale.y -= Math.random() / 10
            this.mesh.scale.z -= Math.random() / 10
            this.membraneOutline.scale.x += Math.random() / 10
            this.membraneOutline.scale.y += Math.random() / 10
        }, (1000 / 12))
        setTimeout(() => {
            // Last frame of animation
            this.mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            scene.remove(this.membraneOutline)
            clearInterval(aniCycle)
        }, 1000)
        setTimeout(() => {
            // Reset everything
            this.mesh.material = cachedMaterial
            scene.add(this.membraneOutline)
            this.mesh.scale.x = 1
            this.mesh.scale.y = 1
            this.mesh.scale.z = 1
            this.membraneOutline.scale.x = 1
            this.membraneOutline.scale.y = 1

            this.animationsInProgress.explode = false
        }, 2000)
    }

    // Remove organism completely
    remove() {
        // Remove from stage
        scene.remove(this.mesh)
        scene.remove(this.membraneOutline)
        // Remove from array
        const index = organisms.findIndex(item => item.id === this.id)
        if (index !== -1) {
            organisms.splice(index, 1);
        }
    }
}

// Main render loop
let idleAnimationsToggle = false
function animate() {
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    function renderFrame() {
        organisms.forEach((organism) => {
            organism.updateMovement()
            // Bounce off edges regardless
            if (organism.mesh.position.x > 6 || organism.mesh.position.x < -6) {
                organism.velocity.x = -organism.velocity.x;
            }
            if (organism.mesh.position.y > 3 || organism.mesh.position.y < -3) {
                organism.velocity.y = -organism.velocity.y;
            }
        });
        renderer.render(scene, camera);
        activeAnimation = requestAnimationFrame(renderFrame);
    }

    renderFrame();
}
animate()

// Add a new organism
function addOrganism(dnaSequence) {
    const newOrganism = new Organism(dnaSequence);
    organisms.push(newOrganism);
    return newOrganism
}

function setIdle(state) {
    idleAnimationsToggle = state
}

// Export functions for external use
export { addOrganism, setIdle };
