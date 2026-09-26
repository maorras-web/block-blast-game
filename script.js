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
    container.style.gridTemplateColumns = `repeat(${shape[0].length}, 24px)`;
    container.style.touchAction = 'none';

    shape.forEach(row => {
        row.forEach(cell => {
            const block = document.createElement('div');
            block.style.width = '24px';
            block.style.height = '24px';
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

    // התאמת גודל הבלוק הנגרר לגודל המשבצות המדויק של הלוח
    const boardCell = boardElement.children[0];
    const cellSize = boardCell.getBoundingClientRect().width;

    const clone = element.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none';
    clone.style.gridTemplateColumns = `repeat(${shape[0].length}, ${cellSize}px)`;
    
    // התאמת גודל התת-בלוקים בשיבוט
    Array.from(clone.children).forEach(child => {
        child.style.width = `${cellSize}px`;
        child.style.height = `${cellSize}px`;
    });

    document.body.appendChild(clone);
    element.style.opacity = '0.1';

    activeDrag = {
        originalElement: element,
        cloneElement: clone,
        shapeData: shape,
        color: color,
        cellSize: cellSize,
        touchOffsetX: e.clientX,
        touchOffsetY: e.clientY
    };

    updateClonePosition(e);

    document.addEventListener('pointermove', onDragging);
    document.addEventListener('pointerup', stopDragging);
}

function onDragging(e) {
    if (!activeDrag) return;
    updateClonePosition(e);
    clearPreview();

    const targetPos = getTargetBoardPosition();
    if (targetPos) {
        if (canPlaceShape(activeDrag.shapeData, targetPos.row, targetPos.col)) {
            showPreview(activeDrag.shapeData, targetPos.row, targetPos.col);
        }
    }
}

function updateClonePosition(e) {
    if (!activeDrag) return;
    const rect = activeDrag.cloneElement.getBoundingClientRect();
    // גרירה ישירה ומדויקת מתחת לסמן/אצבע ללא קפיצות
    activeDrag.cloneElement.style.left = `${e.clientX - rect.width / 2}px`;
    activeDrag.cloneElement.style.top = `${e.clientY - rect.height / 2 - 20}px`;
}

function getTargetBoardPosition() {
    if (!activeDrag) return null;

    const cloneRect = activeDrag.cloneElement.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();

    // חישוב מיקום הבלוק השמאלי-עליון של הצורה ביחס ללוח
    const relativeX = cloneRect.left - boardRect.left;
    const relativeY = cloneRect.top - boardRect.top;

    const col = Math.round(relativeX / (activeDrag.cellSize + 6)); // 6px gap
    const row = Math.round(relativeY / (activeDrag.cellSize + 6));

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        return { row, col };
    }
    return null;
}

function showPreview(shape, startRow, startCol) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c]) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;
                if (targetRow < BOARD_SIZE && targetCol < BOARD_SIZE) {
                    const cell = boardElement.children[targetRow * BOARD_SIZE + targetCol];
                    if (cell) cell.classList.add('preview');
                }
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

    const targetPos = getTargetBoardPosition();

    if (targetPos && canPlaceShape(activeDrag.shapeData, targetPos.row, targetPos.col)) {
        placeShape(activeDrag.shapeData, targetPos.row, targetPos.col, activeDrag.color);
        activeDrag.originalElement.remove();
        checkClears();

        if (shapesContainer.children.length === 0) {
            generateShapes();
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

                if (targetRow >= BOARD_SIZE || targetCol >= BOARD_SIZE || targetRow < 0 || targetCol < 0) {
                    return false;
                }

                if (boardState[targetRow][targetCol]) {
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