const BOARD_SIZE = 8;
const boardElement = document.getElementById('board');
const shapesContainer = document.getElementById('shapes-container');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');

let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

// צורות בסיסיות למשחק
const SHAPES = [
    [[1]], // בלוק יחיד
    [[1, 1]], // זוג אופקי
    [[1], [1]], // זוג אנכי
    [[1, 1, 1]], // שלישייה אופקית
    [[1, 1], [1, 1]], // ריבוע 2x2
    [[1, 1, 1], [0, 1, 0]] // צורת T
];

highScoreElement.textContent = highScore;

// אתחול הלוח
function createBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            boardElement.appendChild(cell);
        }
    }
}

// יצירת צורות חדשות לבחירה
function generateShapes() {
    shapesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const shapeElement = createShapeElement(randomShape);
        shapesContainer.appendChild(shapeElement);
    }
}

function createShapeElement(shape) {
    const container = document.createElement('div');
    container.classList.add('shape-preview');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${shape[0].length}, 20px)`;
    container.style.gap = '2px';

    shape.forEach(row => {
        row.forEach(cell => {
            const block = document.createElement('div');
            block.style.width = '20px';
            block.style.height = '20px';
            block.style.backgroundColor = cell ? '#3b82f6' : 'transparent';
            block.style.borderRadius = '4px';
            container.appendChild(block);
        });
    });

    return container;
}

// איפוס משחק
function restartGame() {
    boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    score = 0;
    scoreElement.textContent = score;
    createBoard();
    generateShapes();
}

restartBtn.addEventListener('click', restartGame);

// הפעלה ראשונית
createBoard();
generateShapes();