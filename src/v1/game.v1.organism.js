/*

    Organism

*/

import { Vector3 } from 'three';
import { BLOCK_TYPENAME_MOTOR } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import OrganismBody from "./game.v1.organism.body"
import { MAX_DIST_IN_TICK_X, MAX_DIST_IN_TICK_Y, MIN_MOTOR_NODES_WITHOUT_ENERGY_CON, MIN_NODES_WITHOUT_ENERGY_CON, MIN_NUM_OF_NODES, MOTOR_MAX_POWER, NATURAL_ENERGY_DEPLETION_AMOUNT } from "./game.v1.references"

class Organism {
    constructor(dnaModel) {
        if (dnaModel instanceof DNA == false) {
            throw new Error("Organism must be initialised with a DNA model")
        }
        this.dnaModel = dnaModel
        this.id = String(Math.random())

        // To be generated
        this.body = new OrganismBody(this.dnaModel)

        // Life
        this.energy = 1
        this.alive = true

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
        // Calc world positions of nodes, to use in this update

        this.body.updateNodePosWorldPositions()

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
    // Essentially apply velocity to the organism, factoring
    // in motors and current rotation
    updateMovement() {
        if (this.body.mesh == null) {
            return
        }

        // Start with the organism's base velocity:

        this.appliedVelocity.x = this.velocity.x;
        this.appliedVelocity.y = this.velocity.y;

        // Gather motor effects in some combined vector:

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
    }
}

export default Organism