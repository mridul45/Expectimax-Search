# 2048 Game in React

This is a modern implementation of the classic 2048 game, built with React, Vite, and Tailwind CSS. It features a sleek, responsive "liquid-glass" UI, smooth animations, and a powerful AI "Companion" that can play the game for you.

## Features

- **Classic 2048 Gameplay**: Slide tiles to merge them and create the 2048 tile.
- **Responsive Design**: Playable on both desktop (keyboard) and mobile (swipe).
- **AI Companion**: An intelligent bot powered by the Expectimax algorithm that can automatically play the game.
- **Undo Functionality**: Revert to the previous move.
- **Persistent Best Score**: Your highest score is saved locally.
- **Modern UI**: A beautiful dark-mode interface with subtle animations and glass-like UI elements.
- **AI Controls**: Tweak the AI's thinking time, speed, and search depth.

## Tech Stack

- **Frontend**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Project Structure

The codebase is organized into a `src` directory with the following key files:

```
/src
├── App.jsx             # Main React component, handles state and rendering.
├── index.css           # Global styles.
├── main.jsx            # Application entry point.
└── utils/
    ├── gameLogic.js    # Core 2048 game mechanics (moving, merging, spawning).
    ├── gameManager.js  # Connects UI actions to game logic.
    ├── companion.js    # AI player using the Expectimax algorithm.
    └── tailwind.js     # Helper for dynamic Tailwind CSS classes.
```

## Core Game Algorithm

The game logic is primarily housed in `src/utils/gameLogic.js`.

### Board Representation

The game board is a 4x4 grid. It is managed as a flat (1D) array of 16 elements for simplicity, where `null` represents an empty cell and an object represents a tile. Helper functions `boardToMatrix` and `matrixToBoard` are used to convert this flat array into a 2D matrix for easier row/column manipulation.

### Move Logic

The core of the move algorithm is the `compressLine` function. This function takes a single line (a row or column of 4 tiles), and processes it in three steps:
1.  **Filter**: It removes all empty cells (`null`).
2.  **Merge**: It iterates through the remaining tiles and merges any two adjacent tiles of the same value. When a merge occurs, the new tile's value is doubled, and the score is increased.
3.  **Pad**: It adds `null` values to the end of the line to bring its length back to 4.

To handle all four directional moves (`up`, `down`, `left`, `right`), the `moveLeft` logic is used as a base. The other directions are achieved by transforming the entire board matrix before and after applying the compression logic:

-   **`moveLeft`**: Applies `compressLine` to each row directly.
-   **`moveRight`**: Reverses each row, applies `compressLine`, and then reverses the result back.
-   **`moveUp`**: Transposes the board (swaps rows and columns), applies `compressLine` to the new "rows", and then transposes the result back.
-   **`moveDown`**: Transposes the board, reverses the new rows, applies `compressLine`, reverses the result, and finally transposes it back.

This approach is efficient and avoids duplicating the core merging logic for each direction.

## AI Companion: Expectimax Algorithm

The AI companion uses the **Expectimax algorithm** to decide the best move. This algorithm is well-suited for single-player games with an element of chance, like 2048 where new tiles spawn randomly.

Expectimax is a variation of the Minimax algorithm. It involves two types of nodes in the decision tree:

1.  **Max Nodes (Player's Turn)**: The AI simulates each of the four possible moves (`left`, `right`, `up`, `down`) and chooses the one that leads to the outcome with the highest score, as determined by a heuristic evaluation function.

2.  **Chance Nodes (Computer's Turn)**: After the player moves, the game randomly spawns a new tile (a '2' with 90% probability or a '4' with 10%) in one of the empty cells. Instead of assuming the worst-case scenario (like Minimax), the Expectimax algorithm calculates the *expected* score by averaging the scores of all possible outcomes, weighted by their probabilities.

### Heuristic Evaluation Function

The `evalBoard` function in `src/utils/companion.js` is the heuristic that scores a given board state. A good heuristic is crucial for the AI's performance. This implementation considers several factors:

-   **Empty Cells**: More empty cells are better, as they provide more room to maneuver.
-   **Potential Merges**: The number of adjacent, identical tiles. This is a good indicator of future merges.
-   **Monotonicity**: A board is monotonic if the tile values in each row and column are either consistently increasing or decreasing. This encourages the AI to build up large tiles smoothly in one direction.
-   **Smoothness**: This penalizes large value differences between adjacent tiles. A smooth board has a more organized structure.
-   **Corner Bias**: This rewards having the highest-value tile in a corner, which is a common and effective strategy in 2048.

### Iterative Deepening

To ensure the AI is responsive and doesn't freeze the UI, the search is performed with **iterative deepening**. The Expectimax search starts with a shallow depth (e.g., 2 moves ahead) and progressively increases the depth. This process is constrained by a time budget (e.g., 50ms). As soon as the time runs out, the search is stopped, and the best move found in the last completed iteration is returned.

## How to Run

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd 2048-react
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:5173`.