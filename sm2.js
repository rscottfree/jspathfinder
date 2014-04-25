nom.init(60, 50, 10);

document.querySelector('#add').addEventListener('click', function(e) {
    nom.add();
});

document.querySelector('#remove').addEventListener('click', function(e) {
    nom.remove();
});

document.querySelector('#run').addEventListener('click', function(e) {
    for(var i = 0; i < 0; i++) {
        // var a = new nom.Actor(Math.floor(Math.random() * 25), Math.floor(Math.random() * 49 + 1));
        // a.moveTo(Math.floor(Math.random() * 35 + 24), Math.floor(Math.random() * 49 + 1));
        
        var a = new nom.Actor(1, Math.floor(Math.random() * 49 + 1));
        a.moveTo(58, Math.floor(Math.random() * 49 + 1));
    }
    
    var a = new nom.Actor(1, 1);
    a.moveTo(58, 48);
    
    nom.run();
});

document.querySelector('#start').addEventListener('click', function(e) {
    nom.run();
});

document.querySelector('#pause').addEventListener('click', function(e) {
    nom.pause();
});