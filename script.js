const BOARD_SIZE = 8;
const boardElement = document.getElementById('board');
const shapesContainer = document.getElementById('shapes-container');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');

let boardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('blockBlastHighScore') || 0;

let activeDrag = null; // מנהל את הבלוק שנגרר כרגע

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
            boardElement.appendChild(cell);
        }
    }
}

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
    container.style.gridTemplateColumns = `repeat(${shape[0].length}, 25px)`;
    container.style.gap = '3px';
    container.style.cursor = 'grab';
    container.style.touchAction = 'none'; // מונע גלילה של המסך בזמן גרירה בנייד

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

    // התחלת גרירה במגע או בעכבר
    container.addEventListener('pointerdown', (e) => startDragging(e, container, shape));

    return container;
}

function startDragging(e, element, shape) {
    e.preventDefault();

    // שכפול הצורה כדי שתצוף על המסך בזמן גרירה
    const clone = element.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none'; // מונע חסימת אירועים מתחתיה
    clone.style.opacity = '0.9';
    clone.style.transform = 'scale(1.1)';
    document.body.appendChild(clone);

    element.style.opacity = '0.2'; // הנמכת שקיפות המקור בזמן גרירה

    activeDrag = {
        originalElement: element,
        cloneElement: clone,
        shapeData: shape
    };

    updateClonePosition(e);

    document.addEventListener('pointermove', onDragging);
    document.addEventListener('pointerup', stopDragging);
}

function onDragging(e) {
    if (!activeDrag) return;
    updateClonePosition(e);
}

function updateClonePosition(e) {
    if (!activeDrag) return;
    const rect = activeDrag.cloneElement.getBoundingClientRect();
    // ממקם את הצורה בדיוק מתחת לאצבע/עכבר
    activeDrag.cloneElement.style.left = `${e.clientX - rect.width / 2}px`;
    activeDrag.cloneElement.style.top = `${e.clientY - rect.height / 2}px`;
}

function stopDragging(e) {
    if (!activeDrag) return;

    document.removeEventListener('pointermove', onDragging);
    document.removeEventListener('pointerup', stopDragging);

    // מציאת ה משבצת מתחת לנקודת השחרור
    activeDrag.cloneElement.style.display = 'none';
    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);

    if (elementUnderCursor && elementUnderCursor.classList.contains('cell')) {
        const startRow = parseInt(elementUnderCursor.dataset.row);
        const startCol = parseInt(elementUnderCursor.dataset.col);

        if (canPlaceShape(activeDrag.shapeData, startRow, startCol)) {
            placeShape(activeDrag.shapeData, startRow, startCol);
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