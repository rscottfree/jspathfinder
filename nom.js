var nom = (function(nomModule) {
    var canvas = document.getElementById('paper');
    var ctx = canvas.getContext('2d');
    var isdrawing = false;
    var adding = true;
    var drawOptions = {
        lasttime: 0,
        tdiff: 0,
        showPaths: true,
        animationRequestID: null
    };

    var pathFinder = null;

    var grids = {
        '_d': null
    };

    ctx.font = 'normal 8px monospace';


    var init = function(xtile, ytile, sizeOfTile) {
        canvas.addEventListener('mousedown', function(e) {
            isdrawing = true;
        });

        canvas.addEventListener('mousemove', function(e) {
            if (isdrawing) {
                changePathSquare(e.offsetX, e.offsetY);
            }
        });

        canvas.addEventListener('mouseup', function(e) {
            isdrawing = false;
        });

        canvas.addEventListener('click', function(e) {
            changePathSquare(e.offsetX, e.offsetY);
        });

        canvas.addEventListener('mouseleave', function(e) {
            isdrawing = false;
        });

        grids._d = new Grid(xtile || 60, ytile || 50, sizeOfTile || 10);

        drawBoard();
    };


    var Grid = function(sizeX, sizeY, tileSize, options) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.tileSize = tileSize;
        this.actors = [];

        this.tiles = [];

        for (var y = 0; y < this.sizeY; y++) {
            for (var x = 0; x < this.sizeX; x++) {
                if (!this.tiles[x]) {
                    this.tiles[x] = [];
                }

                this.tiles[x][y] = 0;
            }
        }
    };


    var Path = function(startx, starty, endx, endy) {
        this.start = {
            x: startx,
            y: starty
        };
        this.end = {
            x: endx,
            y: endy
        };
        this.tiles = [];
    };


    var Actor = function(x, y, options) {
        options = options || {};

        var grid = options.grid || grids._d;

        grid.actors.push(this);

        this.x = x;
        this.y = y;

        this.pixx = this.x * grid.tileSize;
        this.pixy = this.y * grid.tileSize;

        this.path = null;
        this.on = true;
        this.pathStep = 0;

        this.rate = 110;

        this.moving = false;
    };

    Actor.prototype.moveTo = function(gridx, gridy) {
        this.moving = true;

        pathFinder.findPath(this.receivePath.bind(this), this.x, this.y, gridx, gridy);

        return this;
    };

    Actor.prototype.receivePath = function(path) {
        this.path = path;
    };


    var PathFinder = function() {
        this.queue = [];

        // Used in the heuristic
        this.depthModifier = 10; // 3
        this.logging = true;
    };

    PathFinder.prototype.findPath = function(receivePathFunction, startx, starty, endx, endy, grid) {
        this.queue.push(
            function() {
                this.find(startx, starty, endx, endy, grid).then(function(path) {
                    receivePathFunction(path);
                }.bind(this));
            }.bind(this)
        );
    };

    PathFinder.prototype.find = function(startx, starty, endx, endy, grid) {
        return new Promise(function(resolve, reject) {
            var path = null;

            if (!grid) grid = grids._d;
            tiles = grid.tiles;

            if (this.logging) console.time('findPath');

            var open = [];

            var closed = [];
            var scores = [];
            for (var y = 0; y < grid.sizeY; y++) {
                for (var x = 0; x < grid.sizeX; x++) {
                    if (!scores[x]) {
                        scores[x] = [];
                    }
                    scores[x][y] = -1;

                    if (!closed[x]) {
                        closed[x] = [];
                    }
                    closed[x][y] = 0;
                }
            }

            var totalDepth = 0;

            open.push({
                x: startx,
                y: starty,
                heuristic: 0,
                depth: 0
            });
            scores[startx][starty] = 0;

            while (open.length > 0 && totalDepth < 10000) {
                var p = open.shift();

                totalDepth = p.depth;

                // if we reached the end, build and return path
                if (p.x === endx && p.y === endy) {
                    var current = p.cameFrom;

                    path = new Path(startx, starty, endx, endy);
                    path.tiles.push({
                        x: p.x,
                        y: p.y
                    });

                    while (current) {
                        path.tiles.unshift({
                            x: current.x,
                            y: current.y
                        });
                        current = current.cameFrom;
                    }
                }

                closed[p.x][p.y] = 1;

                var tempopen = [];

                var heuristic = 1;

                var ten = 1 * this.depthModifier;
                var fourteen = 1.4 * this.depthModifier; // 1.4

                // manhattan distance seems about as good as true distance, but if you need it more precise, use the commented lines.
                heuristic = Math.abs(endx - p.x) + Math.abs(endy - p.y);
                //heuristic = Math.sqrt(Math.pow(endx - p.x, 2) + Math.pow(endy - (p.y - 1), 2));
                tempopen.push({
                    x: p.x,
                    y: p.y - 1,
                    heuristic: heuristic,
                    depth: p.depth + ten,
                    cameFrom: p
                }); // N

                heuristic = Math.abs(endx - p.x + 1) + Math.abs(endy - p.y - 1);
                //heuristic = Math.sqrt(Math.pow(endx - (p.x + 1), 2) + Math.pow(endy - (p.y - 1), 2));
                tempopen.push({
                    x: p.x + 1,
                    y: p.y - 1,
                    heuristic: heuristic,
                    depth: p.depth + fourteen,
                    cameFrom: p
                }); // NE

                heuristic = Math.abs(endx - p.x + 1) + Math.abs(endy - p.y);
                //heuristic = Math.sqrt(Math.pow(endx - (p.x + 1), 2) + Math.pow(endy - p.y, 2));
                tempopen.push({
                    x: p.x + 1,
                    y: p.y,
                    heuristic: heuristic,
                    depth: p.depth + ten,
                    cameFrom: p
                }); // E

                heuristic = Math.abs(endx - p.x + 1) + Math.abs(endy - p.y + 1);
                //heuristic = Math.sqrt(Math.pow(endx - (p.x + 1), 2) + Math.pow(endy - (p.y + 1), 2));
                tempopen.push({
                    x: p.x + 1,
                    y: p.y + 1,
                    heuristic: heuristic,
                    depth: p.depth + fourteen,
                    cameFrom: p
                }); // SE

                heuristic = Math.abs(endx - p.x - 1) + Math.abs(endy - p.y);
                //heuristic = Math.sqrt(Math.pow(endx - (p.x - 1), 2) + Math.pow(endy - p.y, 2));
                tempopen.push({
                    x: p.x - 1,
                    y: p.y,
                    heuristic: heuristic,
                    depth: p.depth + ten,
                    cameFrom: p
                }); // W

                heuristic = Math.abs(endx - p.x - 1) + Math.abs(endy - p.y - 1);
                //heuristic = Math.sqrt(Math.pow(endx - (p.x - 1), 2) + Math.pow(endy - (p.y - 1), 2));
                tempopen.push({
                    x: p.x - 1,
                    y: p.y - 1,
                    heuristic: heuristic,
                    depth: p.depth + fourteen,
                    cameFrom: p
                }); // NW

                heuristic = Math.abs(endx - p.x) + Math.abs(endy - p.y + 1);
                //heuristic = Math.sqrt(Math.pow(endx - p.x, 2) + Math.pow(endy - (p.y + 1), 2));
                tempopen.push({
                    x: p.x,
                    y: p.y + 1,
                    heuristic: heuristic,
                    depth: p.depth + ten,
                    cameFrom: p
                }); // S

                heuristic = Math.abs(endx - p.x - 1) + Math.abs(endy - p.y + 1);
                //heuristic = Math.sqrt(Math.pow(endx - (p.x - 1), 2) + Math.pow(endy - (p.y + 1), 2));
                tempopen.push({
                    x: p.x - 1,
                    y: p.y + 1,
                    heuristic: heuristic,
                    depth: p.depth + fourteen,
                    cameFrom: p
                }); // SW

                tempopen = tempopen.filter(function(b) {
                    if (undefined === tiles[b.x] || undefined === tiles[b.x][b.y]) {
                        return false;
                    }

                    if (closed[b.x][b.y] === 1) {
                        return false;
                    }

                    if (tiles[b.x][b.y] === 1) {
                        return false;
                    } else {
                        if (p.x - b.x === -1 && p.y - b.y === 1 // NE (neighbor looking SW)
                            && undefined !== tiles[b.x][b.y - 1] && undefined !== tiles[b.x + 1] && tiles[b.x - 1][b.y] === 1 && tiles[b.x][b.y + 1] === 1) {
                            return false;
                        } else if (p.x - b.x === -1 && p.y - b.y === -1 // SE (neighbor looking NW)
                            && undefined !== tiles[b.x][b.y - 1] && undefined !== tiles[b.x - 1] && tiles[b.x][b.y - 1] === 1 && tiles[b.x - 1][b.y] === 1) {
                            return false;
                        } else if (p.x - b.x === 1 && p.y - b.y === -1 // SW (neighbor looking NE)
                            && undefined !== tiles[b.x + 1] && undefined !== tiles[b.x][b.y - 1] && tiles[b.x + 1][b.y] === 1 && tiles[b.x][b.y - 1] === 1) {
                            return false;
                        } else if (p.x - b.x === 1 && p.y - b.y === 1 // NW (neighbor looking SE)
                            && undefined !== tiles[b.x][b.y + 1] && undefined !== tiles[b.x + 1] && tiles[b.x][b.y + 1] === 1 && tiles[b.x + 1][b.y] === 1) {
                            return false;
                        }
                    }

                    var found = false;
                    for (var i = 0; i < open.length; i++) {
                        if (open[i].x === b.x && open[i].y === b.y) {
                            found = true;
                            break;
                        }
                    }

                    if (!found || (b.heuristic + b.depth) < scores[b.x][b.y]) {
                        scores[b.x][b.y] = (b.heuristic + b.depth);

                        if (!found) {
                            return true;
                        }
                    }

                    return false;
                });

                open = open.concat(tempopen);

                open = open.sort(function(a, b) {
                    if ((a.heuristic + a.depth) > (b.heuristic + b.depth)) return 1;
                    else if ((a.heuristic + a.depth) < (b.heuristic + b.depth)) return -1;
                    else return 0;
                });
            }

            if (this.logging) console.timeEnd('findPath');

            resolve(path);
        }.bind(this));
    }



    var drawBoard = function() {
        ctx.clearRect(0, 0, 600, 500);

        for (var x = 0; x < 60; x++) {
            for (var y = 0; y < 50; y++) {
                ctx.fillStyle = 'rgb(240, 250, 240)';
                ctx.fillRect(x * 10, y * 10, 9, 9);
            }
        }

        ctx.fillStyle = 'rgb(0, 255, 0)';
        ctx.fillRect(1 * 10, 1 * 10, 9, 9); // 1, 1

        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.fillRect(58 * 10, 48 * 10, 9, 9); // 58, 48
    };


    var drawPathGrid = function(grid) {
        ctx.save();
        ctx.fillStyle = 'rgb(1, 1, 1)';
        for (var y = 0; y < 50; y++) {
            for (var x = 0; x < 60; x++) {
                if (grids._d.tiles[x][y] === 1) {
                    ctx.fillRect(x * 10, y * 10, 9, 9);
                }
            }
        }
        ctx.restore();
    }


    var drawPath = function(path) {
        ctx.save();
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();

        ctx.moveTo(path.tiles[0].x * 10 + 5, path.tiles[0].y * 10 + 5);

        for (var i = 1; i < path.tiles.length; i++) {
            ctx.lineTo(path.tiles[i].x * 10 + 5, path.tiles[i].y * 10 + 5);
        }

        ctx.stroke();
        ctx.restore();
    };


    var changePathSquare = function(x, y) {
        var px = Math.floor(x / 10);
        var py = Math.floor(y / 10);
        // console.log(px + ', ' + py + ' (' + e.offsetX + ', ' + e.offsetY + ')');

        if (adding) {
            ctx.fillStyle = 'rgb(1, 1, 1)';
            ctx.fillRect(px * 10, py * 10, 9, 9);

            grids._d.tiles[px][py] = 1;
        } else {
            ctx.fillStyle = 'rgb(240, 250, 240)';
            ctx.fillRect(px * 10, py * 10, 9, 9);

            grids._d.tiles[px][py] = 0;
        }

    };


    var run = function() {
        // var path = a.path;
        // var path = findPath(grids._d);

        // if (!path) return;

        if (!drawOptions.animationRequestID) {
            drawOptions.animationRequestID = requestAnimationFrame(draw);
        }

        // draw(0);
    };

    var remove = function() {
        adding = false;
    };

    var add = function() {
        adding = true;
    };

    var pause = function() {
        cancelAnimationFrame(drawOptions.animationRequestID);
        drawOptions.animationRequestID = null;

        drawOptions.lasttime = 0;
        drawOptions.tdiff = 0;
    };

    var draw = function(t) {
        if (!drawOptions.animationRequestID) return;

        var x1, y1, x2, y2, m, stepDistance, angle, cos,
            sin, newDistance, leftOverDistance, toEndDistance,
            distance;

        if (drawOptions.lasttime == 0) drawOptions.lasttime = t;
        drawOptions.tdiff = t - drawOptions.lasttime;

        drawOptions.lasttime = t;

        drawBoard();
        drawPathGrid(grids._d.tiles);

        for (var i = 0; i < grids._d.actors.length; i++) {
            var actor = grids._d.actors[i];
            if (actor.moving && actor.path) {
                distance = (actor.rate / 1000) * drawOptions.tdiff;

                var lastx = actor.pixx;
                var lasty = actor.pixy;

                while (distance > 0 && actor.moving) {
                    x1 = actor.path.tiles[actor.pathStep].x * 10;
                    y1 = actor.path.tiles[actor.pathStep].y * 10;

                    x2 = actor.path.tiles[actor.pathStep + 1].x * 10;
                    y2 = actor.path.tiles[actor.pathStep + 1].y * 10;

                    // get distance between two steps
                    stepDistance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

                    // y = m(x – x1) + y1
                    angle = Math.atan2(y2 - actor.pixy, x2 - actor.pixx);

                    sin = Math.sin(angle) * distance;
                    cos = Math.cos(angle) * distance;

                    toEndDistance = Math.sqrt(Math.pow(x2 - actor.pixx, 2) + Math.pow(y2 - actor.pixy, 2));

                    actor.pixx = actor.pixx + cos;
                    actor.pixy = actor.pixy + sin;

                    newDistance = Math.sqrt(Math.pow(x1 - actor.pixx, 2) + Math.pow(y1 - actor.pixy, 2));

                    leftOverDistance = newDistance - stepDistance;
                    if (leftOverDistance > 0) {
                        actor.pixx = x2;
                        actor.pixy = y2;

                        distance = distance - toEndDistance;

                        actor.pathStep++;

                        if (actor.pathStep >= actor.path.tiles.length - 1) {
                            distance = 0;
                            actor.moving = false;
                            break;
                        }
                    } else {
                        distance = 0;
                    }


                } // end of while


                if (drawOptions.showPaths) {
                    drawPath(actor.path);
                }
            }

            ctx.fillStyle = 'rgb(0, 240, 10)';
            ctx.fillRect(actor.pixx, actor.pixy, 9, 9);
        }

        requestAnimationFrame(draw);

        var p = pathFinder.queue.pop();
        if (p) p();

    }; // end of draw()


    pathFinder = new PathFinder();

    nomModule.init = init;
    nomModule.run = run;
    nomModule.pathFinder = pathFinder;
    nomModule.Actor = Actor;
    nomModule.pause = pause;
    nomModule.add = add;
    nomModule.remove = remove;

    return nomModule;

}(nom || {}));
