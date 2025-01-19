/*

    DNA

    Provides node and sequence structures.

*/

import * as Blocks from './game.v0.2.blocks'

// Node class

class dnaNode {
    constructor(role, block, edges = [], detach = false, parentNode = null, edgeOfParent = null) {
        this.role = role
        this.block = block

        this.edges = new Array(6)
        for (let eI = 0; eI < 6; eI++) {
            if (edges[eI]) {
                this.edges[eI] = edges[eI]
            } else {
                this.edges[eI] = null
            }
        }

        this.detach = detach

        this.parentNode = parentNode
        this.edgeOfParent = edgeOfParent
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
    [
        new dnaNode(
            "appendage",
            new Blocks.DefaultBlock()
        ),
        new dnaNode(
            "appendage",
            new Blocks.DefaultBlock(),
            []
        ),
        new dnaNode(
            "appendage",
            new Blocks.DefaultBlock(),
            []
        ),
        new dnaNode(
            "appendage",
            new Blocks.DefaultBlock(),
            []
        ),
        new dnaNode(
            "appendage",
            new Blocks.DefaultBlock(),
            []
        ),
        new dnaNode(
            "appendage",
            new Blocks.DefaultBlock(),
            []
        )
    ]
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
function addNodeToParent(
    parentNode = null,
    edge = null,
    blockType = Blocks.BLOCK_TYPENAME_DEFAULT
) {
    console.log("creating...", { parentNode, edge })

    // Motor blocks cannot have other motor blocks attached

    if (
        parentNode &&
        parentNode.block.typeName == Blocks.BLOCK_TYPENAME_MOTOR &&
        blockType == Blocks.BLOCK_TYPENAME_MOTOR
    ) {
        return false
    }

    // Default state, will be changed dynamically when returned
    // if a different block type is intended

    const node = new dnaNode(
        "appendage",
        new Blocks.DefaultBlock()
    )

    // Set node block

    if (blockType !== Blocks.BLOCK_TYPENAME_DEFAULT) {
        switch (blockType) {
            case Blocks.BLOCK_TYPENAME_BONDING:
                node.block = new Blocks.BondingBlock()
                break
            case Blocks.BLOCK_TYPENAME_MOTOR:
                node.block = new Blocks.MotorBlock()
                break
        }
    }

    // Add to parent, if available

    if (parentNode && !isNaN(edge)) {
        parentNode.edges[edge] = node

        // These values will be added in the building process
        // anyway, but until then
        node.parentNode = parentNode
        node.edgeOfParent = edge
    } else {
        console.warn("Node created without a parent")
    }

    return node
}

export {
    dnaNode,
    addNodeToParent,
    demoDnaSequence,
    placeholderDefaultRootNode,
    enforceSymmetry
}