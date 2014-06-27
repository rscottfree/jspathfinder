Yet another A* pathfinding implementation in JavaScript.

Demo here: http://rscottfree.github.io/jspathfinder/

Some notes on this implementation:

1) Movement is allowed next to a diagonal path of blocked grid squares, but not between two squares placed diagonally to each other. In general, A* implementations I found allowed the option of diagonal movement but did not allow movement through two diagonally placed squares; my implementation is diagonal by default but does not allow movement between these type of setups.

2) Path finding requests are queued up.

The actual pathfinding code is in the PathFinding object within nom.js. There is other code that is used to test the pathfinding. sm2.js is used to setup an actor and initiate the path movement.

There is a demo at http://rscottfree.github.io/jspathfinder/
Demo instructions: Click and drag the mouse to build obstacles. Click "run" to start the simulation and have an actor move from the green square to the red square. Click "pause" and "start" to control simulation. Click "remove" to have the mouse remove obstacles; switch back to adding by clicking the "add" button.
