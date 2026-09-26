const BOARD_SIZE = 8;
const boardElement = document.getElementById('board');
const shapesContainer = document.getElementById('shapes-container');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');

let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;
let selectedShapeIndex = null;
let currentShapes = [];

const SHAPES = [
    [[1]], 
    [[1, 1]], 
    [[1], [1]], 
    [[1, 1, 1]], 
    [[1, 1], [1, 1]], 
    [[1, 1, 1], [0, 1, 0]]
];

if (highScoreElement) highScoreElement.textContent = highScore;

function createBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // לחיצה על משבצת בלוח להנחת הצורה שנבחרה
            cell.addEventListener('click', () => handleCellClick(r, c));
            
            boardElement.appendChild(cell);
        }
    }
}

function generateShapes() {
    shapesContainer.innerHTML = '';
    currentShapes = [];
    selectedShapeIndex = null;

    for (let i = 0; i < 3; i++) {
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        currentShapes.push(randomShape);
        
        const shapeElement = createShapeElement(randomShape, i);
        shapesContainer.appendChild(shapeElement);
    }
}

function createShapeElement(shape, index) {
    const container = document.createElement('div');
    container.classList.add('shape-preview');
    container.dataset.index = index;
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${shape[0].length}, 22px)`;
    container.style.gap = '3px';
    container.style.cursor = 'pointer';
    container.style.padding = '5px';
    container.style.borderRadius = '8px';

    shape.forEach(row => {
        row.forEach(cell => {
            const block = document.createElement('div');
            block.style.width = '22px';
            block.style.height = '22px';
            block.style.backgroundColor = cell ? '#3b82f6' : 'transparent';
            block.style.borderRadius = '4px';
            container.appendChild(block);
        });
    });

    // סמני לחיצה לבחירת צורה
    container.addEventListener('click', () => {
        document.querySelectorAll('.shape-preview').forEach(el => el.style.border = 'none');
        selectedShapeIndex = index;
        container.style.border = '2px solid #ef4444'; // סימון בצבע אדום
    });

    return container;
}

function handleCellClick(startRow, startCol) {
    if (selectedShapeIndex === null || !currentShapes[selectedShapeIndex]) return;

    const shape = currentShapes[selectedShapeIndex];

    if (canPlaceShape(shape, startRow, startCol)) {
        placeShape(shape, startRow, startCol);
        
        // הסרת הצורה שהונחה
        const shapeElements = shapesContainer.children;
        for (let el of shapeElements) {
            if (parseInt(el.dataset.index) === selectedShapeIndex) {
                el.style.visibility = 'hidden';
                el.style.pointerEvents = 'none';
                break;
            }
        }

        currentShapes[selectedShapeIndex] = null;
        selectedShapeIndex = null;

        checkClears();

        // אם כולן הונחו, ייצר חדשות
        if (currentShapes.every(s => s === null)) {
            generateShapes();
        }
    }
}

function canPlaceShape(shape, startRow, startCol) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c]) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;

                if (targetRow >= BOARD_SIZE || targetCol >= BOARD_SIZE || boardState[targetRow][targetCol]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeShape(shape, startRow, startCol) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c]) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;
                boardState[targetRow][targetCol] = 1;
            }
        }
    }
    score += 10;
    updateScore();
    renderBoard();
}

function checkClears() {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
        if (boardState[r].every(val => val === 1)) rowsToClear.push(r);
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
        if (boardState.every(row => row[c] === 1)) colsToClear.push(c);
    }

    rowsToClear.forEach(r => {
        for (let c = 0; c < BOARD_SIZE; c++) boardState[r][c] = 0;
    });

    colsToClear.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) boardState[r][c] = 0;
    });

    score += (rowsToClear.length + colsToClear.length) * 100;
    updateScore();
    renderBoard();
}

function renderBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = boardElement.children[r * BOARD_SIZE + c];
            cell.style.backgroundColor = boardState[r][c] ? '#3b82f6' : '#334155';
        }
    }
}

function updateScore() {
    if (scoreElement) scoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        if (highScoreElement) highScoreElement.textContent = highScore;
        localStorage.setItem('blockBlastHighScore', highScore);
    }
}

function restartGame() {
    boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    score = 0;
    updateScore();
    renderBoard();
    generateShapes();
}

if (restartBtn) restartBtn.addEventListener('click', restartGame);

createBoard();
generateShapes();