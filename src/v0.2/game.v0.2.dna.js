/*

    DNA

*/

const demoDnaSequence = {
    role: "root",
    color: "yellow",
    offshoots: [
        {
            role: "appendage",
            offshoots: [
                {
                    role: "appendage",
                    offshoots: []
                },
                {
                    role: "appendage",
                    offshoots: []
                },
                {
                    role: "appendage",
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