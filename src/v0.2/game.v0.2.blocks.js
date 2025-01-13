/*

    Blocks (properties)

*/

// Types of block the player can use
const BlockTypeList = []

class DefaultBlock {
    constructor() {
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
        this.color = "red"
    }
    setColor(color) {
        this.color = color
    }
}
BlockTypeList.push("default")

class BondingBlock extends DefaultBlock {
    constructor() {
        super();
        this.to = 0
        this.strength = 0
        this.setColor("lightgreen")
    }
}
BlockTypeList.push("bonding")

class MotorBlock extends DefaultBlock {
    constructor() {
        super();
        this.isMotor = true
        this.speed = 0 /* (angle / sec) */
        this.setColor("yellow")
    }
}
BlockTypeList.push("motor")

class HeartBlock extends DefaultBlock {
    constructor() {
        super();
        this.isHeart = true
        this.healthbar = 100
        this.setColor("pink")
    }
}

export { DefaultBlock, BondingBlock, MotorBlock, HeartBlock, BlockTypeList }