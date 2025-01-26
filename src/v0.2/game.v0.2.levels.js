/*

    Levels

*/

import * as ThreeElements from './game.v0.2.3d'
import * as Plants from "./game.v0.2.plants"
import * as Food from "./game.v0.2.food"

class Level {
    constructor(presetSeed = null) {
        this.plants = []
        this.food = []
        this.temperature = 0
    }
}

export { Level }