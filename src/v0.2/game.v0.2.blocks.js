/*

    Blocks (properties)

*/

// Types of block the player can use
const PlayerAccessibleBlockTypeNamesList = []

class DefaultBlock {
    constructor() {
        this.typeName = "default"
        this.color = "red"
        this.magnetism = {
            power: 0,
            polarity: 0
        }
        this.attraction = {
            to: 0
        }
        this.repulsion = {
            to: 0
        }
    }
    setTypeName(typeName) {
        this.typeName = typeName
    }
    setColor(color) {
        this.color = color
    }
}
PlayerAccessibleBlockTypeNamesList.push("default")

class BondingBlock extends DefaultBlock {
    constructor() {
        super();
        this.to = 0
        this.strength = 0

        this.setTypeName("bonding")
        this.setColor("lightgreen")
    }
}
PlayerAccessibleBlockTypeNamesList.push("bonding")

class MotorBlock extends DefaultBlock {
    constructor() {
        super();
        this.isMotor = true
        this.speed = 0 /* (angle / sec) */

        this.setTypeName("motor")
        this.setColor("yellow")
    }
}
PlayerAccessibleBlockTypeNamesList.push("motor")

class HeartBlock extends DefaultBlock {
    constructor() {
        super();
        this.isHeart = true
        this.healthbar = 100

        this.setTypeName("heart")
        this.setColor("pink")
    }
}

export { DefaultBlock, BondingBlock, MotorBlock, HeartBlock, PlayerAccessibleBlockTypeNamesList }