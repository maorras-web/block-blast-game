const BOARD_SIZE = 8;
const boardElement = document.getElementById('board');
const shapesContainer = document.getElementById('shapes-container');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');

let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;
let activeDrag = null;

// פלטת צבעים מודרנית עם גרדיאנטים/צלליות
const COLORS = [
    { bg: '#38bdf8', shadow: '#0284c7' }, // תכלת
    { bg: '#f43f5e', shadow: '#be123c' }, // אדום
    { bg: '#10b981', shadow: '#047857' }, // ירוק
    { bg: '#fbbf24', shadow: '#d97706' }, // צהוב
    { bg: '#a855f7', shadow: '#7e22ce' }  // סגול
];

const SHAPES = [
    [[1]], 
    [[1, 1]], 
    [[1], [1]], 
    [[1, 1, 1]], 
    [[1, 1], [1, 1]], 
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]]
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
            boardElement.appendChild(cell);
        }
    }
}

function generateShapes() {
    shapesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const shapeElement = createShapeElement(randomShape, randomColor);
        shapesContainer.appendChild(shapeElement);
    }
}

function createShapeElement(shape, color) {
    const container = document.createElement('div');
    container.classList.add('shape-preview');
    container.style.gridTemplateColumns = `repeat(${shape[0].length}, 22px)`;
    container.style.touchAction = 'none';

    shape.forEach(row => {
        row.forEach(cell => {
            const block = document.createElement('div');
            block.style.width = '22px';
            block.style.height = '22px';
            if (cell) {
                block.style.backgroundColor = color.bg;
                block.style.borderRadius = '5px';
                block.style.boxShadow = `inset 0 -3px 0 ${color.shadow}`;
            } else {
                block.style.backgroundColor = 'transparent';
            }
            container.appendChild(block);
        });
    });

    container.addEventListener('pointerdown', (e) => startDragging(e, container, shape, color));
    return container;
}

function startDragging(e, element, shape, color) {
    e.preventDefault();

    const clone = element.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none';
    clone.style.transform = 'scale(1.25)'; // הגדלה קלה לחוויית משחק כיפית
    document.body.appendChild(clone);

    element.style.opacity = '0.1';

    activeDrag = {
        originalElement: element,
        cloneElement: clone,
        shapeData: shape,
        color: color
    };

    updateClonePosition(e);

    document.addEventListener('pointermove', onDragging);
    document.addEventListener('pointerup', stopDragging);
}

function onDragging(e) {
    if (!activeDrag) return;
    updateClonePosition(e);
    clearPreview();

    // בדיקה מעל איזו משבצת נמצאת הצורה הנגררת
    const targetCell = getCellUnderCursor(e);
    if (targetCell) {
        const startRow = parseInt(targetCell.dataset.row);
        const startCol = parseInt(targetCell.dataset.col);

        if (canPlaceShape(activeDrag.shapeData, startRow, startCol)) {
            showPreview(activeDrag.shapeData, startRow, startCol);
        }
    }
}

function updateClonePosition(e) {
    if (!activeDrag) return;
    const rect = activeDrag.cloneElement.getBoundingClientRect();
    // הזזה למעלה (Offset) כדי שהאצבע לא תסתיר את הלוח בזמן גרירה
    activeDrag.cloneElement.style.left = `${e.clientX - rect.width / 2}px`;
    activeDrag.cloneElement.style.top = `${e.clientY - rect.height - 15}px`;
}

function getCellUnderCursor(e) {
    // בודק את האלמנט שנמצא בנקודה שמעל האצבע/סמן
    const rect = activeDrag.cloneElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    activeDrag.cloneElement.style.display = 'none';
    const el = document.elementFromPoint(centerX, centerY);
    activeDrag.cloneElement.style.display = 'grid';

    return el && el.classList.contains('cell') ? el : null;
}

function showPreview(shape, startRow, startCol) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c]) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;
                const cell = boardElement.children[targetRow * BOARD_SIZE + targetCol];
                if (cell) cell.classList.add('preview');
            }
        }
    }
}

function clearPreview() {
    document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));
}

function stopDragging(e) {
    if (!activeDrag) return;

    document.removeEventListener('pointermove', onDragging);
    document.removeEventListener('pointerup', stopDragging);
    clearPreview();

    const targetCell = getCellUnderCursor(e);

    if (targetCell) {
        const startRow = parseInt(targetCell.dataset.row);
        const startCol = parseInt(targetCell.dataset.col);

        if (canPlaceShape(activeDrag.shapeData, startRow, startCol)) {
            placeShape(activeDrag.shapeData, startRow, startCol, activeDrag.color);
            activeDrag.originalElement.remove();
            checkClears();

            if (shapesContainer.children.length === 0) {
                generateShapes();
            }
        } else {
            activeDrag.originalElement.style.opacity = '1';
        }
    } else {
        activeDrag.originalElement.style.opacity = '1';
    }

    activeDrag.cloneElement.remove();
    activeDrag = null;
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

function placeShape(shape, startRow, startCol, color) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c]) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;
                boardState[targetRow][targetCol] = color;
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
        if (boardState[r].every(val => val !== 0)) rowsToClear.push(r);
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
        if (boardState.every(row => row[c] !== 0)) colsToClear.push(c);
    }

    const cellsToAnimate = new Set();

    rowsToClear.forEach(r => {
        for (let c = 0; c < BOARD_SIZE; c++) cellsToAnimate.add(r * BOARD_SIZE + c);
    });

    colsToClear.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) cellsToAnimate.add(r * BOARD_SIZE + c);
    });

    if (cellsToAnimate.size > 0) {
        cellsToAnimate.forEach(index => {
            const cell = boardElement.children[index];
            cell.classList.add('clearing');
        });

        setTimeout(() => {
            rowsToClear.forEach(r => {
                for (let c = 0; c < BOARD_SIZE; c++) boardState[r][c] = 0;
            });

            colsToClear.forEach(c => {
                for (let r = 0; r < BOARD_SIZE; r++) boardState[r][c] = 0;
            });

            score += (rowsToClear.length + colsToClear.length) * 120;
            updateScore();
            renderBoard();
        }, 250);
    }
}

function renderBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = boardElement.children[r * BOARD_SIZE + c];
            cell.classList.remove('clearing');
            const cellData = boardState[r][c];

            if (cellData) {
                cell.style.backgroundColor = cellData.bg;
                cell.style.boxShadow = `inset 0 -3px 0 ${cellData.shadow}`;
            } else {
                cell.style.backgroundColor = '#1e293b';
                cell.style.boxShadow = 'none';
            }
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