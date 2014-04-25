Yet another A* pathfinding implementation in JavaScript.

Some notes on this implementation:
1) Movement is allowed next to a diagonal path of blocked grid squares, but not between two squares placed diagonally to each other. In general, A* implementations I found allowed the option of diagonal movement but allowed movement through two diagonally placed squares; my implementation is diagonal by default but does not allow movement between these type of setups.
2) Path finding requests are queued up.

The actual pathfinding code is in the PathFinding object within nom.js. There is other code that that is used to test the pathfinding.
