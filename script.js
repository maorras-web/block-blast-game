const BOARD_SIZE = 8;
const boardElement = document.getElementById('board');
const shapesContainer = document.getElementById('shapes-container');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');

let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;
let draggedShape = null;

const SHAPES = [
    [[1]], 
    [[1, 1]], 
    [[1], [1]], 
    [[1, 1, 1]], 
    [[1, 1], [1, 1]], 
    [[1, 1, 1], [0, 1, 0]]
];

highScoreElement.textContent = highScore;

function createBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            
            boardElement.appendChild(cell);
        }
    }
}

function generateShapes() {
    shapesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const shapeData = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const shapeElement = createShapeElement(shapeData);
        shapesContainer.appendChild(shapeElement);
    }
}

function createShapeElement(shape) {
    const container = document.createElement('div');
    container.classList.add('shape-preview');
    container.draggable = true;
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${shape[0].length}, 25px)`;
    container.style.gap = '2px';
    container.style.cursor = 'grab';

    shape.forEach(row => {
        row.forEach(cell => {
            const block = document.createElement('div');
            block.style.width = '25px';
            block.style.height = '25px';
            block.style.backgroundColor = cell ? '#3b82f6' : 'transparent';
            block.style.borderRadius = '4px';
            container.appendChild(block);
        });
    });

    container.addEventListener('dragstart', (e) => {
        draggedShape = { element: container, data: shape };
    });

    return container;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedShape) return;

    const startRow = parseInt(e.target.dataset.row);
    const startCol = parseInt(e.target.dataset.col);

    if (canPlaceShape(draggedShape.data, startRow, startCol)) {
        placeShape(draggedShape.data, startRow, startCol);
        draggedShape.element.remove();
        draggedShape = null;
        checkClears();

        if (shapesContainer.children.length === 0) {
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
                
                const cell = boardElement.children[targetRow * BOARD_SIZE + targetCol];
                cell.style.backgroundColor = '#3b82f6';
            }
        }
    }
    score += 10;
    updateScore();
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
    scoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('blockBlastHighScore', highScore);
    }
}

function restartGame() {
    boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    score = 0;
    updateScore();
    createBoard();
    generateShapes();
}

restartBtn.addEventListener('click', restartGame);

createBoard();
generateShapes();