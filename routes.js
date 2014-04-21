var routes = {};
var gameMasters = {};
var fs = require('fs');
var logger = require('winston');
var playerModel = require('./lib/player').player;
var gameMaster = require('./lib/game-master').gameMaster;

var setupLogger = function () {
    logger.remove(logger.transports.Console);
    if(!fs.existsSync('./logs'))
        fs.mkdirSync('./logs');
    logger.add(logger.transports.File, { filename: 'logs/uno-debug.log' });
}

setupLogger();

routes.onDataForEachPlayer = function (data, masterName) {
    var playerNames = Object.keys(data);
    playerNames.forEach(function (playerName) {
        gameMasters[masterName][playerName] = {};
        gameMasters[masterName][playerName]['data'] = data[playerName];
        gameMasters[masterName][playerName]['dataChanged'] = true;
    });
};

routes.onDataForPlayer = function (data, masterName, player) {
    var dataForPlayer = {};
    dataForPlayer['data'] = data[player.name];
    dataForPlayer['dataChanged'] = true;
    gameMasters[masterName][player.name] = dataForPlayer;
};

routes.startGameMaster = function (req, res) {
    var masterName = req.body.masterName;
    var noOfPacks = req.body.noOfPacks;
    var noOfPlayers = req.body.noOfPlayers;

    logger.info(masterName + ' requested to start a game for ' + noOfPlayers + ' players with ' + noOfPacks + ' pack');
    if (gameMasters[masterName]) {
        res.send('INUSE');
        logger.warn('Game was already present with ' + masterName + ' name');
        return;
    }
    var master = gameMaster.startGameMaster(noOfPacks, noOfPlayers, routes, masterName);
    gameMasters[masterName] = master;
    res.send();

    logger.info('Game was started for ' + masterName);
};

routes.joinGame = function (req, res) {
    var playerName = req.body.playerName;
    var masterName = req.body.masterName;
    if (!gameMasters[masterName]) {
        res.send('');
        //add logger
        return;
    };
    logger.info(playerName + ' requested to join game of master '+ masterName);
    var status = gameMaster.canPlayerJoin(gameMasters[masterName], playerName);
    if (!status.canJoin) {
        res.send(status.msg);
        logger.warn(playerName + ' was not able to join the game of' + masterName + ' because of ' + status.msg)
        return;
    }
    var player = playerModel.createPlayer(playerName);
    gameMaster.onPlayerRegistered(gameMasters[masterName], player);
    res.send();
    logger.info(playerName + ' joined game of master '+masterName);
};

routes.closeMaster = function (req, res) {
    var masterName = req.body.master;
    delete gameMasters[masterName];
    res.send();
};

routes.masters = function(req,res){
    var masters = Object.keys(gameMasters);
    res.send(masters);
}

routes.getAllMasters = function (req, res) {
    var allMasters = Object.keys(gameMasters);
    var waitingMasters = [];
    allMasters.forEach(function(master){
        if(!gameMasters[master].isRunning)
            waitingMasters.push(master);
    });
    res.send(waitingMasters);
    logger.info('Got request for all the available Games');
};

function getPlayerByName(masterName, playerName) {
    var players = gameMasters[masterName].players;
    for (var i = 0; i < players.length; i++) {
        if (players[i].name == playerName)
            return players[i];
    }
}

routes.playCard = function (req, res) {
    var masterName = req.body.masterName;
    var playerName = req.body.playerName;
    var player = getPlayerByName(masterName, playerName);
    var newColor = req.body.color;
    var playedCard = req.body.card;
    gameMaster.onCardPlayed(gameMasters[masterName], playedCard, newColor, player);
    res.send();
    logger.info(playerName + ' played a ' + JSON.stringify(playedCard) + ' with ' + newColor 
        + ' color in game of master '+ masterName);
};

routes.drawCard = function (req, res) {
    var masterName = req.body.masterName;
    var playerName = req.body.playerName;
    var player = getPlayerByName(masterName, playerName);
    gameMaster.onPlayerDrewACard(gameMasters[masterName], player);
    res.send();
    logger.info(playerName + ' drew a card in game of master '+masterName);
};

routes.drawTwoCards = function (req, res) {
    var masterName = req.body.masterName;
    var playerName = req.body.playerName;
    var player = getPlayerByName(masterName, playerName);
    gameMaster.onDrawTwoAction(gameMasters[masterName], player);
    res.send();
    logger.info(playerName + ' drew 2 cards in game of master '+masterName);
};

routes.onNoAction = function (req, res) {
    var masterName = req.body.masterName;
    var playerName = req.body.playerName;
    var player = getPlayerByName(masterName, playerName);
    gameMaster.onNoActionAfterDraw(gameMasters[masterName], player);
    res.send();
    logger.info('no action played by ' + playerName+' in game of master '+masterName);
};

routes.declareUno = function (req, res) {
    var masterName = req.body.masterName;
    var playerName = req.body.playerName;
    var player = getPlayerByName(masterName, playerName);
    gameMaster.declareUno(gameMasters[masterName], player);
    res.send();
    logger.info(playerName + ' declared uno in game of master '+masterName);
};

routes.catchPlayer = function (req, res) {
    var masterName = req.body.masterName;
    var playerName = req.body.playerName;
    var caughtPlayerName = req.body.caughtPlayerName;
    var player = getPlayerByName(masterName, playerName);
    var caughtPlayer = getPlayerByName(masterName, caughtPlayerName);
    gameMaster.catchUno(gameMasters[masterName], caughtPlayer, player);
    res.send();
    logger.info(caughtPlayerName + ' caught by ' + playerName+' in game of master '+masterName);
};

routes.getSnapshot = function (req, res) {
    var masterName = req.query.masterName;
    var playerName = req.query.playerName;
    if (!gameMasters[masterName]) {
        res.send('');
        //add logger
        return;
    }
    var playerDetails = gameMasters[masterName][playerName];
    if (playerDetails && playerDetails['dataChanged']) {
        playerDetails['dataChanged'] = false;
        res.send(playerDetails['data']);
        logger.info(playerName + ' got a snapshot  in game of master '+masterName);
        return;
    }
    res.send('');
};

exports.routes = routes;