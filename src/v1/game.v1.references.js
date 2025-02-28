/*

    References (shared constants)

*/

import { stageEdges3D } from "./game.v1.3d";

// Styles

const COMMON_PRIMARY_COLOR = "#04b1fd"
const COMMON_SECONDARY_COLOR = "#5BD585"

// Rendering

const UPDATES_PER_SEC = 24

// DNA nodes

const DNA_NODE_ROLE_APPENDAGE = "DNA_NODE_ROLE_APPENDAGE"
const DNA_NODE_ROLE_ROOT = "DNA_NODE_ROLE_ROOT"

// Organism body

const NODESIZE_DEFAULT = 6

// Motion

const MOTOR_MAX_POWER = 0.1
const MAX_DIST_IN_TICK_X = Math.abs(
    stageEdges3D.top.left.x -
    stageEdges3D.top.right.x) * 0.025;
const MAX_DIST_IN_TICK_Y = Math.abs(
    stageEdges3D.top.left.y -
    stageEdges3D.bottom.left.y) * 0.025;
const MIN_NUM_OF_NODES = 6

// Energy

const NATURAL_ENERGY_DEPLETION_AMOUNT = 0.0125 / 100
const MIN_NODES_WITHOUT_ENERGY_CON = 6
const MIN_MOTOR_NODES_WITHOUT_ENERGY_CON = 0.5

const ENERGY_PER_FOOD_BLOCK = 0.5

// Game

const GAME_MODE_PLAY = "GAME_MODE_PLAY"
const GAME_MODE_SANDBOX = "GAME_MODE_SANDBOX"

export {
    COMMON_PRIMARY_COLOR,
    COMMON_SECONDARY_COLOR,
    UPDATES_PER_SEC,
    DNA_NODE_ROLE_APPENDAGE,
    DNA_NODE_ROLE_ROOT,
    NODESIZE_DEFAULT,
    MOTOR_MAX_POWER,
    MAX_DIST_IN_TICK_X,
    MAX_DIST_IN_TICK_Y,
    MIN_NUM_OF_NODES,
    NATURAL_ENERGY_DEPLETION_AMOUNT,
    MIN_NODES_WITHOUT_ENERGY_CON,
    MIN_MOTOR_NODES_WITHOUT_ENERGY_CON,
    ENERGY_PER_FOOD_BLOCK,
    GAME_MODE_PLAY,
    GAME_MODE_SANDBOX
}