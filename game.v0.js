// Puzzle

// Basic setup for the game canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function shuffleArray(array) {
    const values = array
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values
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
}

const dnaRoles = shuffleArray([
    // The 'values' property is only for roles which can't be controlled numerically
    {
        type: "body",
        title: "color",
        values: ["red", "orange", "yellow", "lightgreen", "green", "blue", "purple"]
        // a disguise maybe?
    },
    {
        type: "body",
        title: "edges",
        values: [3, 4, 5, 6, 7, 8]
    },
    {
        type: "body",
        title: "move-style",
        values: ["float", "tail", "legs"]
        // float, legs, tail
    },
    {
        type: "body",
        title: "membrane",
        values: [1, 2.5, 5, 7.5, 10]
    },
    {
        type: "body",
        title: "size",
        values: [0.5, 0.75, 1, 1.25]
        // size
    },
    {
        type: "body",
        title: "eyes",
        values: [1, 2, 3, 4, 5]
        // eyes
    },
    {
        type: "body",
        title: "spiky-ness",
        values: [0, 0.25, 0.5]
    },
    {
        type: "system",
        title: "gravity resistance",
        values: ["low", "medium", "high"]
        // gravity resistance
    },
    {
        type: "system",
        title: "energy-consumption"
        // relative to speed, but means organism dies quicker
    },
    {
        type: "system",
        title: "aggression"
        // how hard it will fight (and possibly die from exhaustion) or flee (i.e get chased lol)
    },
    {
        type: "system",
        title: "reproducing"
        // how frequently it will reproduce (i.e split into two copies — though each copy halves
        // in size and strength)
    },
    {
        type: null,
        title: null
    },
    {
        type: null,
        title: null
    },
    {
        type: null,
        title: null
    }
]);

// Organism DNA grid
const gridSize = Math.round(Math.sqrt(dnaRoles.length));
const dnaGrid = [];

for (let roleI = 0; roleI < dnaRoles.length; roleI++) {
    const row = Math.floor(roleI / gridSize);
    if (typeof dnaGrid[row] !== "object") {
        dnaGrid.push([]);
    }
    const dnaRole = dnaRoles[roleI]

    let currentSet = 0
    if ("values" in dnaRole) {
        currentSet = Math.round(Math.random() * (dnaRole.values.length - 1))
    } else {
        currentSet = Math.round((Math.random() * 100) / 10) * 10
    }
    dnaGrid[row].push({
        current: currentSet,
        colorCodes: shuffleObjectValues(dnaColors),
        role: dnaRole
    });
}

console.log(dnaGrid);

// Draw the DNA grid
const rotationAngles = [
    0,               // 0°
    Math.PI / 2,     // 90°
    Math.PI,         // 180°
    Math.PI * 1.5,   // 270°
    2 * Math.PI      // 360°
]
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cellSize = canvas.width / gridSize;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const dna = dnaGrid[row][col];
            if (dna) {
                if ("values" in dna.role) {
                    currentMax = dna.role.values.length - 1
                    ctx.fillStyle = dna.colorCodes[dna.current * 10]
                } else {
                    currentMax = 100
                    ctx.fillStyle = dna.colorCodes[dna.current]
                }


                if (dna.role.type == "system") {
                    // Square
                    ctx.fillRect(
                        (col * cellSize + 2) + 4,
                        (row * cellSize + 2) + 4,
                        cellSize - 12,
                        cellSize - 12
                    );
                }
                if (dna.role.type == "body") {
                    // Triangle

                    const width = cellSize - 12
                    const height = cellSize - 12

                    const startX = (col * cellSize + 2) + 4
                    const startY = ((row * cellSize + 2) + height) + 4

                    // Draw

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);               // Starting point (top of the triangle)
                    ctx.lineTo(startX + width, startY);       // Right corner of the base
                    ctx.lineTo(startX + width / 2, startY - height); // Peak of the triangle
                    ctx.closePath();

                    // Fill the triangle with a color
                    ctx.fill();
                }
            }
        }
    }
    const traits = buildOrganismFromDNA(dnaGrid);
    drawOrganism(traits);
    animateOrganism(traits);
}

// Adjust DNA piece values (cycle through values manually for testing)
canvas.addEventListener('click', (e) => {
    const cellSize = canvas.width / gridSize;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    const dna = dnaGrid[row][col];
    if (dna) {
        if ("values" in dna.role) {
            const maxRoleValueIndex = dna.role.values.length
            dna.current = dna.current == (maxRoleValueIndex - 1) ? 0 : (dna.current + 1);
        } else {
            dna.current = dna.current == 100 ? 0 : (dna.current + 10);
        }
        drawGrid();
        console.log(dna);
    }
});

// Initialize canvas and grid
document.addEventListener('DOMContentLoaded', () => {
    canvas.width = 300;
    canvas.height = 300;
    drawGrid();

    // Add a button to start combat simulation
    const combatButton = document.getElementById('simulateCombat');
    combatButton.addEventListener('click', simulateCombat);
});

/*

    Organism Visuals

*/

// Organism Builder and Animator
const organismCanvas = document.getElementById('organismCanvas');
const organismCtx = organismCanvas.getContext('2d');
organismCanvas.width = 600;
organismCanvas.height = 300;

// Gravity effect and movement variables
const gravity = 0.5;
let organismY = organismCanvas.width / 2;
let velocityY = 0;
let organismX = organismCanvas.width / 2;
let velocityX = 0.5;
let tailAngle = 0;
let tailDirection = 1;
let activeAnimation = null;

// Extract appearance genes
let organismTraits = {};
let cachedMoveStyle = organismTraits.moveStyle;
const cachedVelocity = { x: 0, y: 0 }
function buildOrganismFromDNA(dnaGrid) {
    for (let row of dnaGrid) {
        for (let cell of row) {
            if (cell.role.type === 'body') {
                switch (cell.role.title) {
                    case 'color':
                        organismTraits.color = cell.role.values[cell.current];
                        break;
                    case 'edges':
                        organismTraits.edges = cell.role.values[cell.current];
                        break;
                    case 'move-style':
                        organismTraits.moveStyle = cell.role.values[cell.current];
                        break;
                    case 'membrane':
                        organismTraits.membrane = cell.role.values[cell.current];
                        break;
                    case 'size':
                        organismTraits.size = cell.role.values[cell.current];
                        break;
                    case 'eyes':
                        organismTraits.eyes = cell.role.values[cell.current];
                        break;
                    case 'spiky-ness':
                        organismTraits.spikiness = cell.role.values[cell.current];
                        break;
                    case 'gravity resistance':
                        organismTraits.gravityResistance = cell.role.values[cell.current];
                        break;
                }
            }
            if (cell.role.type === 'system') {
                if (cell.role.title === 'energy-consumption') {
                    organismTraits.energyConsumption = Math.max(0.1, cell.current / 100); // Speed multiplier
                }
            }
        }
    }

    // Adjust gravity based on resistance
    switch (organismTraits.gravityResistance) {
        case 'low':
            organismTraits.gravityEffect = gravity * 2;
            break;
        case 'medium':
            organismTraits.gravityEffect = gravity;
            break;
        case 'high':
            organismTraits.gravityEffect = gravity / 2;
            break;
        default:
            organismTraits.gravityEffect = gravity;
    }

    // Velocity
    if (organismTraits.moveStyle === 'tail') {
        velocityX = (2 * (Math.random() > 0.5 ? 1 : -1)) * organismTraits.energyConsumption;
        velocityY = (2 * (Math.random() > 0.5 ? 1 : -1)) * organismTraits.energyConsumption;
    } else {
        velocityX = 0.5 * organismTraits.energyConsumption;
        velocityY = 0;
    }

    // Reset position for new modes
    if (cachedMoveStyle !== organismTraits.moveStyle) {
        organismX = organismCanvas.width / 2;
        organismY = organismCanvas.height / 2;

        cachedVelocity.x = velocityX
        cachedVelocity.y = velocityY

        cachedMoveStyle = organismTraits.moveStyle;
    }

    return organismTraits;
}

// Draw organism based on traits
function drawOrganism(traits) {
    organismCtx.clearRect(0, 0, organismCanvas.width, organismCanvas.height);

    // Calculate rotation angle based on velocity
    const organismAngle = Math.atan2(velocityY, velocityX);

    // Setup context for drawing
    organismCtx.lineWidth = traits.membrane;
    organismCtx.strokeStyle = 'black';
    organismCtx.save();
    organismCtx.translate(organismX, organismY);
    organismCtx.rotate(organismAngle);

    // Draw legs if in "legs" mode
    if (traits.moveStyle === 'legs') {
        const legLength = 20 * traits.size;
        const legWidth = 5 * traits.size;
        organismCtx.fillStyle = 'black';

        for (let i = 0; i < traits.edges; i++) {
            // Alternate spike depth
            const spikeFactor = 1 - traits.spikiness * (i % 2 === 0 ? 0.5 : 1);
            const angle = (2 * Math.PI / traits.edges) * i;
            const x = 45 * traits.size * spikeFactor * Math.cos(angle);
            const y = 45 * traits.size * spikeFactor * Math.sin(angle);

            organismCtx.save();
            organismCtx.translate(x, y);
            organismCtx.rotate(angle);
            organismCtx.fillRect(-legWidth / 2, 0, legLength, legWidth);
            organismCtx.restore();
        }
    }

    // Draw tail if in "tail" mode
    if (traits.moveStyle === 'tail') {
        organismCtx.strokeStyle = 'black';
        organismCtx.lineWidth = 5 * traits.size;

        organismCtx.beginPath();
        organismCtx.moveTo(25 * traits.size, 0);
        const tailLength = 65 * traits.size;
        const tailEndX = -tailLength;
        const tailEndY = tailAngle * 20;
        organismCtx.lineTo(tailEndX, tailEndY);
        organismCtx.stroke();
    }

    // Draw shape with spikiness
    organismCtx.lineWidth = traits.membrane;
    organismCtx.fillStyle = traits.color;
    organismCtx.beginPath();
    const angleStep = (2 * Math.PI) / traits.edges;
    for (let i = 0; i < traits.edges; i++) {
        // Alternate spike depth
        const spikeFactor = 1 - traits.spikiness * (i % 2 === 0 ? 0.5 : 1);
        const angle = i * angleStep;
        const x = 50 * traits.size * spikeFactor * Math.cos(angle);
        const y = 50 * traits.size * spikeFactor * Math.sin(angle);
        if (i === 0) {
            organismCtx.moveTo(x, y);
        } else {
            organismCtx.lineTo(x, y);
        }
    }
    organismCtx.closePath();
    organismCtx.fill();
    organismCtx.stroke();

    // Draw eyes
    organismCtx.fillStyle = 'black';
    for (let i = 0; i < traits.eyes; i++) {
        // Alternate spike depth
        const spikeFactor = 1 - traits.spikiness * (i % 2 === 0 ? 0.5 : 1);
        const angle = (2 * Math.PI / traits.eyes) * i;
        const eyeX = 20 * traits.size * spikeFactor * Math.cos(angle);
        const eyeY = 20 * traits.size * spikeFactor * Math.sin(angle);
        organismCtx.beginPath();
        organismCtx.arc(eyeX, eyeY, 5 * traits.size, 0, 2 * Math.PI);
        organismCtx.fill();
    }

    organismCtx.restore();
}

// Animate organism
function animateOrganism(traits) {
    if (activeAnimation) cancelAnimationFrame(activeAnimation);

    if (traits.moveStyle === 'float') {
        function idleAnimation() {
            organismX += Math.random() > 0.5 ? -0.1 : 0.1;
            organismY += Math.random() > 0.5 ? -0.1 : 0.1;

            drawOrganism(traits);
            activeAnimation = requestAnimationFrame(idleAnimation);
        }

        idleAnimation();
    } else if (traits.moveStyle === 'tail') {
        function swimAnimation() {
            // Update tail angle for waving motion
            tailAngle += (tailDirection * (0.5 * organismTraits.energyConsumption));
            if (tailAngle > Math.PI / 4 || tailAngle < -Math.PI / 4) {
                tailDirection *= -1;
            }

            // Move organism in current direction
            organismX += velocityX;
            organismY += velocityY;

            // Bounce off edges and change direction
            if (organismX <= 50 || organismX >= organismCanvas.width - 50) {
                velocityX *= -1;
            }
            if (organismY <= 50 || organismY >= organismCanvas.height - 50) {
                velocityY *= -1;
            }

            drawOrganism(traits);
            activeAnimation = requestAnimationFrame(swimAnimation);
        }

        swimAnimation();
    } else {
        function applyGravity() {
            velocityY += traits.gravityEffect;
            organismY += velocityY;

            if (organismY + 50 * traits.size > organismCanvas.height) {
                velocityY = -velocityY * 0.8; // Bounce
                organismY = organismCanvas.height - 50 * traits.size;
            }

            drawOrganism(traits);
            activeAnimation = requestAnimationFrame(applyGravity);
        }

        applyGravity();
    }
}

/*

    Combat

*/

// Combat mode
function simulateCombat() {
    // Cancel previous animations if any
    cancelAnimationFrame(activeAnimation);
    organismCtx.restore();

    // Generate enemy organism
    const enemyTraits = generateRandomEnemy();
    enemyTraits.organismX = Math.random() * (organismCanvas.width - 100) + 50; // Random spawn within bounds
    enemyTraits.organismY = Math.random() * (organismCanvas.height - 100) + 50;
    enemyTraits.velocityX = 0.5 * enemyTraits.energyConsumption;
    enemyTraits.velocityY = 0.5 * enemyTraits.energyConsumption;

    // Initialize combat parameters
    let playerEnergy = 100;
    const playerEnergyBar = document.createElement("progress")
    document.body.appendChild(playerEnergyBar)

    let enemyEnergy = 100;
    const enemyEnergyBar = document.createElement("progress")
    document.body.appendChild(enemyEnergyBar)

    let playerHealth = 100;
    const playerHealthBar = document.createElement("progress")
    document.body.appendChild(playerHealthBar)

    let enemyHealth = 100;
    const enemyHealthBar = document.createElement("progress")
    document.body.appendChild(enemyHealthBar)

    function generateRandomEnemy() {
        const enemyDNA = dnaGrid.map(row =>
            row.map(cell => ({
                ...cell,
                current: Math.floor(Math.random() * ("values" in cell.role ? cell.role.values.length : 11)) * 10
            }))
        );
        return buildOrganismFromDNA(enemyDNA);
    }

    function checkCollision(playerX, playerY, enemyX, enemyY, traits1, traits2) {
        const distance = Math.hypot(playerX - enemyX, playerY - enemyY);
        const combinedRadii = 50 * traits1.size + 50 * traits2.size;
        return distance <= combinedRadii;
    }

    function calculateDamage(attackerTraits, defenderTraits) {
        const spikeFactor = attackerTraits.spikiness * 10; // Higher spikiness deals more damage
        const membraneFactor = defenderTraits.membrane * 10; // Thicker membrane absorbs more damage
        return Math.max(0, spikeFactor - membraneFactor);
    }

    function combatAnimation() {
        organismCtx.clearRect(0, 0, organismCanvas.width, organismCanvas.height);

        // Movement and fleeing logic
        if (organismTraits.aggression < 3) {
            velocityX = organismX > enemyTraits.organismX ? 1 : -1;
            velocityY = organismY > enemyTraits.organismY ? 1 : -1;
        } else {
            velocityX = organismX > enemyTraits.organismX ? -1 : 1;
            velocityY = organismY > enemyTraits.organismY ? -1 : 1;
        }

        if (enemyTraits.aggression < 3) {
            enemyTraits.velocityX = enemyTraits.organismX > organismX ? 1 : -1;
            enemyTraits.velocityY = enemyTraits.organismY > organismY ? 1 : -1;
        } else {
            enemyTraits.velocityX = enemyTraits.organismX > organismX ? -1 : 1;
            enemyTraits.velocityY = enemyTraits.organismY > organismY ? -1 : 1;
        }

        // Update positions
        organismX += velocityX * organismTraits.energyConsumption;
        organismY += velocityY * organismTraits.energyConsumption;

        enemyTraits.organismX += enemyTraits.velocityX * enemyTraits.energyConsumption;
        enemyTraits.organismY += enemyTraits.velocityY * enemyTraits.energyConsumption;

        // Check collisions
        if (checkCollision(organismX, organismY, enemyTraits.organismX, enemyTraits.organismY, organismTraits, enemyTraits)) {
            const playerDamage = calculateDamage(enemyTraits, organismTraits);
            const enemyDamage = calculateDamage(organismTraits, enemyTraits);

            playerHealth -= playerDamage;
            enemyHealth -= enemyDamage;
        }

        // Decrease energy
        playerEnergy -= organismTraits.energyConsumption;
        enemyEnergy -= enemyTraits.energyConsumption;

        // Draw organisms
        drawOrganism(organismTraits);
        drawEnemyOrganism(enemyTraits);

        // Check end of combat
        if (playerHealth <= 0 || playerEnergy <= 0) {
            console.log('Defeat! Your organism has been destroyed or ran out of energy.');
            cancelAnimationFrame(activeAnimation);
        } else if (enemyHealth <= 0 || enemyEnergy <= 0) {
            console.log('Victory! The enemy organism has been destroyed or ran out of energy.');
            cancelAnimationFrame(activeAnimation);
        } else {
            activeAnimation = requestAnimationFrame(combatAnimation);
        }
    }

    function drawEnemyOrganism(traits) {
        organismCtx.save();
        organismCtx.translate(traits.organismX, traits.organismY);
        organismCtx.fillStyle = 'red';
        organismCtx.beginPath();
        const angleStep = (2 * Math.PI) / traits.edges;
        for (let i = 0; i < traits.edges; i++) {
            const angle = i * angleStep;
            const spikeFactor = 1 - traits.spikiness * (i % 2 === 0 ? 0.5 : 1); // Alternate spike depth
            const x = 50 * traits.size * spikeFactor * Math.cos(angle);
            const y = 50 * traits.size * spikeFactor * Math.sin(angle);
            if (i === 0) {
                organismCtx.moveTo(x, y);
            } else {
                organismCtx.lineTo(x, y);
            }
        }
        organismCtx.closePath();
        organismCtx.fill();
        organismCtx.restore();
    }

    combatAnimation();
}

document.getElementById("simulateCombat").onclick = () => {
    simulateCombat()
}
