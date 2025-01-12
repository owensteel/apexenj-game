/*

    DNA

*/

import * as Blocks from './game.v0.2.blocks'

const demoDnaSequence = {
    role: "root",
    block: new Blocks.HeartBlock(),
    offshoots: [
        {
            role: "appendage",
            block: new Blocks.DefaultBlock(),
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
    ]
}

function createNode(parentNode = null) {
    const node = {
        role: null,
        offshoots: []
    }

    // TODO
    node.role = "appendage"

    if (node.role == "color") {
        if (parentNode && parentNode.offshoots.some(obj => obj.role === "color")) {
            // Cannot be defined twice
            alert("This node already has a color defined.")
            return createNode(parentNode)
        }
        node.value = prompt("Node value?")
    }

    if (node.role == null) {
        // Invalid input
        return false
    }

    if (parentNode) {
        parentNode.offshoots.push(node)
    }

    return node
}

export { createNode, demoDnaSequence }