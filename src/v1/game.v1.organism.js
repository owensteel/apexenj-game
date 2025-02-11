/*

    Organism

*/

import { Vector3 } from 'three';
import { BLOCK_TYPENAME_FOOD, BLOCK_TYPENAME_MOTOR } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import OrganismBody from "./game.v1.organism.body"
import { MAX_DIST_IN_TICK_X, MAX_DIST_IN_TICK_Y, MIN_MOTOR_NODES_WITHOUT_ENERGY_CON, MIN_NODES_WITHOUT_ENERGY_CON, MIN_NUM_OF_NODES, MOTOR_MAX_POWER, NATURAL_ENERGY_DEPLETION_AMOUNT, NODESIZE_DEFAULT } from "./game.v1.references"
import { stageEdges3D } from './game.v1.3d';
import { generateID } from './game.v1.utils';
import Pool from './game.v1.pool';
import OrganismUI from './game.v1.organism.ui';

const FOOD_RESPAWN_INTERVAL_SECS = 15

// "Bump" organism off of canvas edges

function bumpCanvasEdges(organism) {
    // If there are no nodes, skip
    if (organism.body.nodePositions.length < 1) return;

    const organismNodesWorld = organism.body.nodePositions.map((nodePos) => {
        return nodePos.worldPos
    })

    // Grab stage edges
    const canvasRightX = stageEdges3D.top.right.x;
    const canvasLeftX = stageEdges3D.bottom.left.x;
    const canvasTopY = stageEdges3D.top.right.y;
    const canvasBottomY = stageEdges3D.bottom.right.y;

    // Find the bounding box of the organism
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const pos of organismNodesWorld) {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
    }

    // Determine how much we need to shift to keep the bounding box in-bounds
    let shiftX = 0;
    let shiftY = 0;

    // If the right edge is out of bounds, shift left
    if (maxX > canvasRightX) {
        shiftX = canvasRightX - maxX;
    }
    // If the left edge is out of bounds, shift right
    if (minX < canvasLeftX) {
        // Note: if minX is out of bounds in the other direction,
        // you might need to compare which shift is larger, or just apply them in separate steps
        shiftX = canvasLeftX - minX;
    }

    // If the top edge is out of bounds, shift down
    if (maxY > canvasTopY) {
        shiftY = canvasTopY - maxY;
    }
    // If the bottom edge is out of bounds, shift up
    if (minY < canvasBottomY) {
        shiftY = canvasBottomY - minY;
    }

    // Apply one shift to bring the bounding box inside the stage
    organism.body.mesh.position.x += shiftX;
    organism.body.mesh.position.y += shiftY;

    if (Math.abs(shiftX) > 0 || Math.abs(shiftY) > 0) {
        organism.body.mesh.rotation.z += (Math.PI * 2) * (0.0125 * organism.energy)
    }
}

// Organism model

class Organism {
    constructor(dnaModel, id, homePool) {
        if (dnaModel instanceof DNA == false) {
            throw new Error("Organism must be initialised with a DNA model")
        }
        this.dnaModel = dnaModel

        if (homePool instanceof Pool == false) {
            throw new Error("Organism must have a home Pool specified")
        }
        this.homePool = homePool

        if (id) {
            this.id = id
        } else {
            this.id = generateID()
        }

        // UI
        this.ui = new OrganismUI(this)

        // To be generated
        this.body = new OrganismBody(this.dnaModel)

        // Life
        this.energy = 1
        this.alive = true

        // Caching
        this.absorbedFood = []

        // Movement
        this.velocity = { x: 0, y: 0 }
        this.appliedVelocity = { x: 0, y: 0, finalX: 0, finalY: 0 }
    }
    updateDna(dnaModel) {
        if (dnaModel instanceof DNA == false) {
            throw new Error("Organism must be initialised with a DNA model")
        }
        this.dnaModel = dnaModel

        // Rebuild body/mesh with new DNA
        this.body.updateDna(this.dnaModel)
    }
    updateLivingState() {
        // Calc world positions of nodes, to use in entire update
        this.body.updateNodePosWorldPositions()

        // Plant activity
        if (BLOCK_TYPENAME_FOOD in this.body.nodePosByBlockTypeCache) {
            for (const foodNodePos of this.body.nodePosByBlockTypeCache[BLOCK_TYPENAME_FOOD]) {
                if (
                    foodNodePos.isEaten &&
                    (
                        foodNodePos.eatenAt &&
                        (
                            (Date.now() - foodNodePos.eatenAt) >=
                            (FOOD_RESPAWN_INTERVAL_SECS * 1000)
                        )
                    )
                ) {
                    // Interval expired
                    foodNodePos.mesh.visible = true
                    foodNodePos.isEaten = false
                }
            }
        }

        // Prevent "burning" non-existent energy
        if (this.energy <= 0) {
            // Prevents energy going into negatives and
            // subsequently becoming "infinite"
            this.energy = 0

            return
        }

        // Deplete energy
        let energyDepletion = NATURAL_ENERGY_DEPLETION_AMOUNT

        // More nodes = more energy consumed
        energyDepletion /= (
            MIN_NODES_WITHOUT_ENERGY_CON /
            this.body.nodePositions.length
        )

        // Motor nodes consume more energy
        if (BLOCK_TYPENAME_MOTOR in this.body.nodePosByBlockTypeCache) {
            // Num of motor blocks = sum of all the *applied power* from
            // motor blocks. I.e, a motor block only applying half the
            // power technically only counts as half a motor block. This
            // means less energy is consumed if motor blocks are going
            // slower, e.g due to low energy.
            const motorBlocksActualNum = this.body.nodePosByBlockTypeCache[BLOCK_TYPENAME_MOTOR]
                .reduce(
                    (accumulator, nodePos) => accumulator + nodePos.node.block.appliedPowerPerc,
                    0
                );
            energyDepletion /= (
                MIN_MOTOR_NODES_WITHOUT_ENERGY_CON
                / motorBlocksActualNum
            )
        }

        // Deplete 'energy'
        this.energy -= energyDepletion

        // Death check
        this.alive = (
            Math.round((this.energy * 100) / 10) * 10
        ) > 0
    }
    // Essentially apply motion to the organism
    // Apply velocity factoring in motors and current
    // rotation
    // And bump canvas edges
    updateMovement(animationEffectsOnly = false) {
        if (this.body.mesh == null) {
            return
        }

        // Animations/effects

        // Motor nodes

        let totalMotorX = 0;
        let totalMotorY = 0;
        let totalPower = 0;

        const nodePosByBlockTypeCache = this.body.nodePosByBlockTypeCache
        if (BLOCK_TYPENAME_MOTOR in nodePosByBlockTypeCache) {
            // Each motor node modifies the velocity by pushing in a certain direction
            for (const motorNodePos of nodePosByBlockTypeCache[BLOCK_TYPENAME_MOTOR]) {
                // The local angle from organism root => motor node
                const motorAngle = Math.atan2(motorNodePos.y, motorNodePos.x);

                // Energy affects motor power
                const motorPowerByEnergy = MOTOR_MAX_POWER * this.energy
                motorNodePos.node.block.appliedPowerPerc = motorPowerByEnergy / MOTOR_MAX_POWER

                // Convert that to a velocity vector:
                // e.g. each motor pushes outward along (cos(angle), sin(angle)) times power
                const vx = -(motorPowerByEnergy * Math.cos(motorAngle));
                const vy = -(motorPowerByEnergy * Math.sin(motorAngle));

                totalMotorX += vx;
                totalMotorY += vy;
                totalPower += motorPowerByEnergy;

                // Rotate motor node by factoring in rotation Z (motorAngle)
                const axis = new Vector3(
                    -Math.sin(motorAngle - (Math.PI / 2)),
                    Math.cos(motorAngle - (Math.PI / 2)),
                    0
                ).normalize();
                const spinAmount = (Math.hypot(vx, vy));
                motorNodePos.mesh.rotateOnAxis(axis, spinAmount);
            }
        }

        // Finish here if we are only updating the
        // animations/effects for this organism
        // (e.g if movement is controlled by a server)
        if (animationEffectsOnly) {
            return
        }

        // Start with the organism's base velocity:

        this.appliedVelocity.x = this.velocity.x;
        this.appliedVelocity.y = this.velocity.y;

        // Add the total motor effect to the applied velocity

        this.appliedVelocity.x += totalMotorX;
        this.appliedVelocity.y += totalMotorY;

        // Reduce effect of velocity depending on the size of the
        // organism

        const sizeSlowdown = (MIN_NUM_OF_NODES / this.body.nodePositions.length)
        this.appliedVelocity.x *= sizeSlowdown
        this.appliedVelocity.y *= sizeSlowdown

        // Actually apply movement

        this.appliedVelocity.finalX = (
            MAX_DIST_IN_TICK_X *
            (
                (this.appliedVelocity.x * Math.cos(this.body.mesh.rotation.z)) -
                (this.appliedVelocity.y * Math.sin(this.body.mesh.rotation.z))
            )
        )
        this.appliedVelocity.finalY = (
            MAX_DIST_IN_TICK_Y *
            (
                (this.appliedVelocity.x * Math.sin(this.body.mesh.rotation.z)) +
                (this.appliedVelocity.y * Math.cos(this.body.mesh.rotation.z))
            )
        )

        this.body.mesh.position.x += this.appliedVelocity.finalX
        this.body.mesh.position.y += this.appliedVelocity.finalY

        // Bump edges

        bumpCanvasEdges(this)
    }
}

export default Organism