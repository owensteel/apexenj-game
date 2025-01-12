/*

    Blocks (properties)

*/

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

class BondingBlock extends DefaultBlock {
    constructor() {
        super();
        this.to = 0
        this.strength = 0
        this.setColor("green")
    }
}

class MotorBlock extends DefaultBlock {
    constructor() {
        super();
        this.isMotor = true
        this.speed = 0 /* (angle / sec) */
        this.setColor("yellow")
    }
}

class HeartBlock extends DefaultBlock {
    constructor() {
        super();
        this.isHeart = true
        this.healthbar = 100
        this.setColor("pink")
    }
}

export { DefaultBlock, BondingBlock, MotorBlock, HeartBlock }