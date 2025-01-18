/*

    DNA



*/

import * as Blocks from './game.v0.2.blocks'

// Node class

class dnaNode {
    constructor(role, block, edges = [], detach = false) {
        this.role = role
        this.block = block

        this.edges = new Array(7)
        for (let eI = 0; eI < 5; eI++) {
            this.edges[eI] = edges[eI]
        }

        this.detach = detach
    }
}

// Controls whether or not organisms have symmetrical builds, i.e the root's
// offshoot is duplicated an amount of times to mirror the whole sequence on
// each side. Currently switched off as it seems counter-intuitive to building
const enforceSymmetry = false

// A "demo" DNA sequence that provides a prebuilt model, which is especially
// handy when debugging
const demoDnaSequence = new dnaNode(
    "root",
    new Blocks.HeartBlock(),
    // [
    //     new dnaNode(
    //         "appendage",
    //         new Blocks.DefaultBlock()
    //     ),
    //     new dnaNode(
    //         "appendage",
    //         new Blocks.DefaultBlock(),
    //         []
    //     )
    // ]
)

// Provided for cases where an organism is to be created and then imminently
// updated dynamically, but still needs to be created out of *something*
// Furthermore, provides a safer and quicker alternative to the demo DNA
// sequence
const placeholderDefaultRootNode = new dnaNode(
    "root",
    new Blocks.HeartBlock()
)

// Adds a new node to a parent in a sequence
function addNodeToParent(parentNode = null, edge = null) {
    console.log("creating...", { parentNode, edge })

    // Default state, will be changed dynamically when returned
    // if a different block type is intended
    const node = new dnaNode(
        "appendage",
        new Blocks.DefaultBlock()
    )

    if (parentNode && !isNaN(edge)) {
        parentNode.edges[edge] = node
    } else {
        console.warn("Node created without a parent")
    }

    return node
}

export { addNodeToParent, demoDnaSequence, placeholderDefaultRootNode, enforceSymmetry }