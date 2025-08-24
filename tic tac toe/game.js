document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let board = Array(9).fill('');
    let currentPlayer = 'X';
    let gameActive = false;
    let difficulty = 'medium'; // Default difficulty
    let playerSymbol = 'X';
    let computerSymbol = 'O';

    // DOM elements
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.querySelector('.status');
    const restartButton = document.querySelector('.restart-btn');
    const gameContainer = document.querySelector('.game-container');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const difficultySelector = document.querySelector('.difficulty-selector');

    // Winning conditions
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    // Show symbol selection screen
    function showSymbolSelector() {
        difficultySelector.classList.add('hidden');
        document.querySelector('.symbol-selector').classList.remove('hidden');

        // Add event listeners for symbol selection
        document.querySelectorAll('.symbol-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove selection from all options
                document.querySelectorAll('.symbol-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Select clicked option
                option.classList.add('selected');

                // Set player and computer symbols
                playerSymbol = option.dataset.symbol;
                computerSymbol = playerSymbol === 'X' ? 'O' : 'X';

                // Start the game after a short delay
                setTimeout(initGame, 500);
            });
        });
    }

    // Initialize the game
    function initGame() {
        board = Array(9).fill('');
        gameActive = true;

        // Set initial player based on symbol choice
        currentPlayer = 'X'; // X always goes first in the game logic
        
        // Update UI
        updateGameStatus();
        
        // Reset all cells
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.style.pointerEvents = 'auto';
        });

        // Hide symbol selector and show game board
        document.querySelector('.symbol-selector').classList.add('hidden');
        gameContainer.classList.remove('hidden');
        setTimeout(() => gameContainer.classList.add('visible'), 10);

        // If computer goes first (player chose O), make a move
        if (playerSymbol === 'O') {
            cells.forEach(cell => cell.style.pointerEvents = 'none');
            setTimeout(makeAIMove, 500);
        }
    }

    // Handle cell click
    function handleCellClick(e) {
        const cell = e.target;
        const cellIndex = parseInt(cell.getAttribute('data-index'));

        // If cell is already filled or game is not active, or not player's turn, return
        if (board[cellIndex] !== '' || !gameActive || currentPlayer !== playerSymbol) {
            return;
        }

        // Make player move
        makeMove(cell, cellIndex, playerSymbol);

        // Check for win or draw
        if (checkWin(playerSymbol)) {
            handleGameEnd(false);
            return;
        } else if (checkDraw()) {
            handleGameEnd(true);
            return;
        }

        // Switch to AI's turn
        currentPlayer = computerSymbol;
        updateGameStatus();
        
        // Disable board while AI is thinking
        cells.forEach(cell => cell.style.pointerEvents = 'none');

        // AI makes a move after a short delay
        setTimeout(() => {
            if (checkDraw()) {
                handleGameEnd(true);
                return;
            }
            
            makeAIMove();

            // Check for win or draw after AI's move
            if (checkWin(computerSymbol)) {
                handleGameEnd(false);
            } else if (checkDraw()) {
                handleGameEnd(true);
            } else {
                // Switch back to player's turn
                currentPlayer = playerSymbol;
                updateGameStatus();
                cells.forEach(cell => {
                    if (cell.textContent === '') {
                        cell.style.pointerEvents = 'auto';
                    }
                });
            }
        }, 500);
    }

    // Make a move on the board
    function makeMove(cell, index, symbol) {
        board[index] = symbol;
        cell.textContent = symbol;
        cell.classList.add(symbol.toLowerCase());

        // Add computer move effect
        if (symbol === computerSymbol) {
            cell.classList.add('computer-move');
            // Remove the effect after animation completes
            setTimeout(() => {
                cell.classList.remove('computer-move');
            }, 1000);
        }
    }

    // Helper function to update game status display
    function updateGameStatus() {
        if (currentPlayer === playerSymbol) {
            statusDisplay.textContent = `Your turn (${playerSymbol})`;
            statusDisplay.style.color = '#fff';
        } else {
            statusDisplay.textContent = 'AI is thinking...';
        }
    }

    // AI makes a move based on difficulty level
    function makeAIMove() {
        // Check if there are any moves left
        if (board.every(cell => cell !== '')) {
            handleGameEnd(true); // It's a draw
            return;
        }
        
        // Disable all cells while AI is thinking
        cells.forEach(cell => {
            cell.style.pointerEvents = 'none';
        });
        
        let move;
        let isSmartMove = false;

        // Determine the move based on difficulty
        if (difficulty === 'easy') {
            // Easy: Completely random moves
            move = getRandomMove();
            isSmartMove = false;
        } else if (difficulty === 'medium') {
            // Medium: 60% chance of smart move, 40% random
            isSmartMove = Math.random() < 0.6;
            move = isSmartMove ? getBestMove() : getRandomMove();
        } else { // hard
            // Hard: Always use best move with minimax
            move = getBestMove();
            isSmartMove = true;
        }

        // If no valid move was found (shouldn't happen, but just in case)
        if (move === undefined || board[move] !== '') {
            const availableMoves = [];
            board.forEach((cell, index) => {
                if (cell === '') availableMoves.push(index);
            });
            if (availableMoves.length > 0) {
                move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            } else {
                handleGameEnd(true); // No moves left, it's a draw
                return;
            }
            isSmartMove = false;
        }

        // Make the move after a short delay for better UX
        const cell = document.querySelector(`.cell[data-index="${move}"]`);
        if (cell) {
            const delay = isSmartMove ? 800 : 400;
            
            setTimeout(() => {
                // Make the move
                makeMove(cell, move, computerSymbol);
                
                // Check if the game is over
                if (checkWin(computerSymbol)) {
                    handleGameEnd(false);
                    return;
                } else if (checkDraw()) {
                    handleGameEnd(true);
                    return;
                }
                
                // Switch back to player's turn
                currentPlayer = playerSymbol;
                updateGameStatus();
                
                // Re-enable empty cells for player's move
                cells.forEach(cell => {
                    if (cell.textContent === '') {
                        cell.style.pointerEvents = 'auto';
                    }
                });
            }, delay);
        }
    }

    // Get random available move
    function getRandomMove() {
        const availableMoves = [];
        board.forEach((cell, index) => {
            if (cell === '') availableMoves.push(index);
        });
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    
    // Get best move using minimax algorithm
    function getBestMove() {
        // Check for immediate win
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = computerSymbol;
                if (checkWin(computerSymbol)) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        
        // Block player's win
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = playerSymbol;
                if (checkWin(playerSymbol)) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }

        // Use minimax for hard difficulty
        if (difficulty === 'hard') {
            return getBestMoveUsingMinimax();
        }
        
        // For medium difficulty, use a strategic approach
        // Take center if available
        if (board[4] === '') return 4;
        
        // Take corners if available
        const corners = [0, 2, 6, 8].filter(i => board[i] === '');
        if (corners.length > 0) {
            // Try to take a corner that could lead to a win
            for (const corner of corners) {
                board[corner] = computerSymbol;
                if (checkWin(computerSymbol)) {
                    board[corner] = '';
                    return corner;
                }
                board[corner] = '';
            }
            return corners[Math.floor(Math.random() * corners.length)];
        }
        
        // Take any available edge
        const edges = [1, 3, 5, 7].filter(i => board[i] === '');
        if (edges.length > 0) {
            return edges[Math.floor(Math.random() * edges.length)];
        }
        
        // Fallback to random move (shouldn't happen as we check for draw earlier)
        return getRandomMove();
    }
    
    // Minimax algorithm for hard difficulty
    function getBestMoveUsingMinimax() {
        let bestScore = -Infinity;
        let bestMove;
        
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = computerSymbol;
                let score = minimax(board, 0, false);
                board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }
    
    function minimax(board, depth, isMaximizing) {
        // Check terminal states
        if (checkWin(computerSymbol)) return 10 - depth;
        if (checkWin(playerSymbol)) return depth - 10;
        if (checkDraw()) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = computerSymbol;
                    let score = minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = playerSymbol;
                    let score = minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    // Check for win
    function checkWin(player) {
        return winConditions.some(condition => {
            const [a, b, c] = condition;
            return board[a] !== '' && board[a] === board[b] && board[a] === board[c] && board[a] === player;
        });
    }
    
    // Check for draw
    function checkDraw() {
        return board.every(cell => cell !== '');
    }
    
    // Handle game end
    function handleGameEnd(draw) {
        gameActive = false;
        if (draw) {
            statusDisplay.textContent = "Game ended in a draw!";
            statusDisplay.style.color = "#fff";
        } else {
            const isPlayerWin = currentPlayer === playerSymbol;
            if (isPlayerWin) {
                statusDisplay.textContent = "You Win!";
                statusDisplay.style.color = "#4fc3f7";
            } else {
                statusDisplay.textContent = "AI Wins!";
                statusDisplay.style.color = "#ff6b6b";
            }
            
            // Highlight winning cells
            winConditions.forEach(condition => {
                const [a, b, c] = condition;
                if (board[a] !== '' && board[a] === board[b] && board[a] === board[c]) {
                    document.querySelector(`.cell[data-index="${a}"]`).classList.add('winner');
                    document.querySelector(`.cell[data-index="${b}"]`).classList.add('winner');
                    document.querySelector(`.cell[data-index="${c}"]`).classList.add('winner');
                }
            });
        }
    }
    
    // Event listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficulty = button.dataset.difficulty;
            showSymbolSelector();
        });
    });
    
    restartButton.addEventListener('click', () => {
        gameContainer.classList.remove('visible');
        setTimeout(() => {
            gameContainer.classList.add('hidden');
            showSymbolSelector();
        }, 300);
    });
    
    document.querySelector('.change-difficulty-btn').addEventListener('click', () => {
        gameContainer.classList.remove('visible');
        setTimeout(() => {
            gameContainer.classList.add('hidden');
            difficultySelector.classList.remove('hidden');
        }, 300);
    });
});
