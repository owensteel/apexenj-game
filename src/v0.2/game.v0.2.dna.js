/*

    DNA



*/

import * as Blocks from './game.v0.2.blocks'

// Controls whether or not organisms have symmetrical builds, i.e the root's
// offshoot is duplicated an amount of times to mirror the whole sequence on
// each side. Currently switched off as it seems counter-intuitive to building
const enforceSymmetry = false

// A "demo" DNA sequence that provides a prebuilt model, which is especially
// handy when debugging
const demoDnaSequence = {
    role: "root",
    block: new Blocks.HeartBlock(),
    offshoots: [
        {
            role: "appendage",
            block: new Blocks.DefaultBlock(),
            offshoots: []
        },
        {
            role: "appendage",
            block: new Blocks.DefaultBlock(),
            offshoots: []
        },
        {
            role: "appendage",
            block: new Blocks.DefaultBlock(),
            offshoots: []
        }
    ]
}

// Provided for cases where an organism is to be created and then imminently
// updated dynamically, but still needs to be created out of *something*
// Furthermore, provides a safer and quicker alternative to the demo DNA
// sequence
const placeholderDefaultRootNode = {
    role: "root",
    block: new Blocks.HeartBlock(),
    detach: false,
    offshoots: []
}

// Adds a new node to a parent in a sequence
function createNode(parentNode = null) {
    // If symmetry is enforced, the root can only have one offshoot (since that
    // offshoot is the one duplicated for symmetry)
    if (enforceSymmetry && parentNode.role == "root" && parentNode.offshoots.length > 0) {
        return false
    }

    // Attractors cannot have children as that defeats their purpose
    if (parentNode.block.typeName.split("-")[0] == "attractor") {
        return false
    }

    // Default state, will be changed dynamically when returned
    // if a differentblock type is intended
    const node = {
        role: "appendage",
        block: new Blocks.DefaultBlock(),
        offshoots: []
    }

    if (parentNode) {
        parentNode.offshoots.push(node)
    }

    return node
}

export { createNode, demoDnaSequence, placeholderDefaultRootNode, enforceSymmetry }