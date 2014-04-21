var gameMaster = {};
var gameModel = require('./game').gameModel;
var playerModel = require('./player.js').player;

gameMaster.startGameMaster = function (noOfPacks, noOfPlayers, observer, masterName) {
    var master = {};
    master.noOfPacks = noOfPacks;
    master.noOfPlayers = noOfPlayers;
    master.observer = observer;
    master.name = masterName;
    master.players = [];
    master.game;
    master.isRunning = false;
    return master;
}

var sendResultToEachPlayer = function (master) {
    var result = {};
    result.type = "gameResult";
    gameModel.populateResult(master.game, result);
    var snapshot = {};
    master.players.forEach(function (player) {
        snapshot[player.name] = result;
    });
    master.observer.onDataForEachPlayer(snapshot, master.name);
};

function sendSnapshotToPlayer(master, player) {
    var snapshot = {};
    master.players.forEach(function (plyr) {
        if (plyr.name != player.name)
            return;
        var snapshotForPlayer = {};
        gameModel.populate(master.game, snapshotForPlayer, plyr);
        snapshotForPlayer.disableDraw = true;
        snapshot[plyr.name] = snapshotForPlayer;
    });
    master.observer.onDataForPlayer(snapshot, master.name, player);
}

function sendSnapshotToEachPlayer(master) {
    var snapshot = {};
    master.players.forEach(function (player) {
        var snapshotForPlayer = {};
        gameModel.populate(master.game, snapshotForPlayer, player);
        snapshot[player.name] = snapshotForPlayer;
    });
    master.observer.onDataForEachPlayer(snapshot, master.name);
};

var startGame = function (master) {
    master.game = gameModel.createGame(master.noOfPacks, master.players);
    gameModel.initialize(master.game);
    sendSnapshotToEachPlayer(master);
};

gameMaster.canPlayerJoin = function (master, playerName) {
    var result = {msg: '', canJoin: true};
    if (master.isRunning) {
        result.msg = 'FULL';
        result.canJoin = false;
        return result;
    }
    for (var i = 0; i < master.players.length; i++) {
        if (master.players[i].name == playerName) {
            result.msg = 'INUSE';
            result.canJoin = false;
            return result;
        }
    }
    return result;
};

gameMaster.onPlayerRegistered = function (master, player) {
    master.players.push(player);
    if (master.players.length == master.noOfPlayers) {
        startGame(master);
        master.isRunning = true;
    }
};

gameMaster.onCardPlayed = function (master, card, newColor, player) {
    gameModel.playCard(master.game, player, card, newColor);
    if (playerModel.hasWon(player)) {
        sendResultToEachPlayer(master);
        return;
    }
    sendSnapshotToEachPlayer(master);
};

gameMaster.onPlayerDrewACard = function (master, player) {
    gameModel.drawCard(master.game, player);
    sendSnapshotToPlayer(master, player);
};

gameMaster.onNoActionAfterDraw = function (master, player) {
    gameModel.moveForwardAsPlayerTookNoActionOnDrawnCard(master.game, player);
    sendSnapshotToEachPlayer(master);
};

gameMaster.onDrawTwoAction = function (master, player) {
    gameModel.drawTwoCards(master.game, player);
    sendSnapshotToEachPlayer(master);
};

gameMaster.declareUno = function (master, player) {
    gameModel.declareUno(master.game, player);
    sendSnapshotToEachPlayer(master);
}
gameMaster.catchUno = function (master, caughtPlayer, player) {
    gameModel.catchUno(master.game, caughtPlayer, player);
    sendSnapshotToEachPlayer(master);
}

exports.gameMaster = gameMaster;