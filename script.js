document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const board = document.getElementById('board');
    const turnIndicator = document.getElementById('turn-indicator');
    const scoreXElement = document.getElementById('score-x');
    const scoreOElement = document.getElementById('score-o');
    const labelO = document.getElementById('label-o');
    const btnPvp = document.getElementById('btn-pvp');
    const btnPvc = document.getElementById('btn-pvc');
    const resetBtn = document.getElementById('reset-btn');
    const resultModal = document.getElementById('result-modal');
    const resultMessage = document.getElementById('result-message');
    const playAgainBtn = document.getElementById('play-again-btn');

    let gameState = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;
    let scores = { X: 0, O: 0 };
    let gameMode = 'pvp'; // 'pvp' or 'pvc'

    const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    // Initialization
    updateTurnIndicator();

    // Event Listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    btnPvp.addEventListener('click', () => setGameMode('pvp'));
    btnPvc.addEventListener('click', () => setGameMode('pvc'));
    resetBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', () => {
        resultModal.classList.remove('show');
        resetGame();
    });

    function handleCellClick(e) {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (gameState[clickedCellIndex] !== '' || !gameActive) {
            return;
        }

        makeMove(clickedCell, clickedCellIndex, currentPlayer);

        if (gameMode === 'pvc' && gameActive && currentPlayer === 'O') {
            // Disable clicks while computer is "thinking"
            board.style.pointerEvents = 'none';
            setTimeout(() => {
                makeComputerMove();
                board.style.pointerEvents = 'all';
            }, 600); // Add a small delay for realism
        }
    }

    function makeMove(cell, index, player) {
        gameState[index] = player;
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
        
        checkResult();
        
        if (gameActive) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateTurnIndicator();
        }
    }

    function updateTurnIndicator() {
        if (currentPlayer === 'X') {
            turnIndicator.textContent = "X's Turn";
            turnIndicator.className = 'turn-indicator x-turn';
        } else {
            turnIndicator.textContent = gameMode === 'pvc' ? "Computer's Turn" : "O's Turn";
            turnIndicator.className = 'turn-indicator o-turn';
        }
    }

    function checkResult() {
        let roundWon = false;
        let winningCells = [];

        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
                roundWon = true;
                winningCells = [a, b, c];
                break;
            }
        }

        if (roundWon) {
            endGame(false, winningCells);
            return;
        }

        let roundDraw = !gameState.includes('');
        if (roundDraw) {
            endGame(true);
            return;
        }
    }

    function endGame(draw, winningCells = []) {
        gameActive = false;

        if (draw) {
            resultMessage.textContent = "It's a Draw!";
            resultMessage.style.color = 'var(--text-primary)';
        } else {
            const winner = currentPlayer;
            resultMessage.textContent = winner === 'X' ? 'Player X Wins!' : (gameMode === 'pvc' ? 'Computer Wins!' : 'Player O Wins!');
            resultMessage.style.color = winner === 'X' ? 'var(--x-color)' : 'var(--o-color)';
            
            scores[winner]++;
            updateScores();

            // Highlight winning cells
            winningCells.forEach(index => {
                cells[index].classList.add('win');
            });
        }

        setTimeout(() => {
            resultModal.classList.add('show');
        }, 800);
    }

    function updateScores() {
        scoreXElement.textContent = scores.X;
        scoreOElement.textContent = scores.O;
    }

    function resetGame() {
        gameState = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'X';
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell'; // Reset classes
        });
        
        updateTurnIndicator();
    }

    function setGameMode(mode) {
        if (gameMode === mode) return;
        
        gameMode = mode;
        if (mode === 'pvp') {
            btnPvp.classList.add('active');
            btnPvc.classList.remove('active');
            labelO.textContent = 'Player O';
        } else {
            btnPvc.classList.add('active');
            btnPvp.classList.remove('active');
            labelO.textContent = 'Computer';
        }
        
        // Reset scores when changing modes
        scores = { X: 0, O: 0 };
        updateScores();
        resetGame();
    }

    // Computer AI logic (Minimax for unbeatable AI, but let's stick to a strong heuristic so it's fun)
    function makeComputerMove() {
        if (!gameActive) return;
        
        let moveIndex = -1;

        // 1. Check for winning move
        moveIndex = findBestMove('O');
        
        // 2. Check for blocking move
        if (moveIndex === -1) {
            moveIndex = findBestMove('X');
        }

        // 3. Take center if available
        if (moveIndex === -1 && gameState[4] === '') {
            moveIndex = 4;
        }

        // 4. Take random available corner
        if (moveIndex === -1) {
            const corners = [0, 2, 6, 8];
            const availableCorners = corners.filter(index => gameState[index] === '');
            if (availableCorners.length > 0) {
                // Add a bit of randomness to not always pick the first available corner
                moveIndex = availableCorners[Math.floor(Math.random() * availableCorners.length)];
            }
        }

        // 5. Take any random available cell
        if (moveIndex === -1) {
            const emptyCells = gameState.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
            if (emptyCells.length > 0) {
                moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        }

        if (moveIndex !== -1) {
            const cell = cells[moveIndex];
            makeMove(cell, moveIndex, 'O');
        }
    }

    function findBestMove(player) {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            
            // Check if two cells match and the third is empty
            if (gameState[a] === player && gameState[b] === player && gameState[c] === '') return c;
            if (gameState[a] === player && gameState[c] === player && gameState[b] === '') return b;
            if (gameState[b] === player && gameState[c] === player && gameState[a] === '') return a;
        }
        return -1;
    }
});
