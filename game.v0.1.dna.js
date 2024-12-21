/*

    DNA Utils

*/

// Shuffle function for arrays
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Shuffle function for DNA color codes
function shuffleObjectValues(obj) {
    const values = shuffleArray(Object.values(obj));
    const keys = Object.keys(obj);
    const shuffledObj = {};
    keys.forEach((key, index) => {
        shuffledObj[key] = values[index];
    });
    return shuffledObj;
}

// DNA statics
const dnaColors = {
    0: "pink",
    10: "red",
    20: "orange",
    30: "yellow",
    40: "lightgreen",
    50: "green",
    60: "lightblue",
    70: "blue",
    80: "darkblue",
    90: "purple",
    100: "black"
};

const dnaRoles = shuffleArray([
    {
        type: "body",
        title: "color",
        values: ["red", "orange", "yellow", "lightgreen", "green", "blue", "purple"]
    },
    {
        type: "body",
        title: "edges",
        values: [3, 6, 8, 10, 12, 14, 16]
    },
    {
        type: "body",
        title: "move-style",
        values: ["float", "tail", "legs"]
    },
    {
        type: "body",
        title: "membrane",
    },
    {
        type: "body",
        title: "size",
        values: [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5]
    },
    {
        type: "body",
        title: "spiky-ness"
    },
    {
        type: "body",
        title: "eyes",
        values: [1, 2, 3, 4, 5] // Number of eyes
    },
    {
        type: "system",
        title: "gravity resistance",
        values: ["low", "medium", "high"]
    },
    {
        type: "system",
        title: "energy-consumption"
    },
    {
        type: "system",
        title: "aggression"
    },
]);

// DNA sequence (1D array)
function generateRandomDNASequence() {
    return dnaRoles.map(role => {
        let currentSet = 0;
        if ("values" in role) {
            currentSet = Math.floor(Math.random() * role.values.length);
        } else {
            currentSet = Math.floor(Math.random() * 11) * 10;
        }
        return {
            current: currentSet,
            colorCodes: shuffleObjectValues(dnaColors),
            role
        };
    });
}

export { generateRandomDNASequence }