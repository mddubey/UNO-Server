var gameModel = {};
var player = require('./player.js').player;
var card = require('./card.js').card;
var deck = require('./deck.js').deck;

gameModel.createGame = function (noOfPacks, givenPlayers) {
    var game = {};
    game.players = givenPlayers;
    game.closedDeck = deck.create(noOfPacks);
    game.openDeck = deck.create(0);
    game.currentPlayerIndex = 0;
    game.isInAscendingOrder = true;
    game.runningColor;
    game.drawTwoRun = 0;
    game.log = [];
    game.hint = '';
    return game;
};

gameModel.initialize = function (game) {
    game.players.sort(function () {
        return 0.5 - Math.random()
    });
    deck.shuffle(game.closedDeck);
    for (var i = 0; i < 7; i++) {
        game.players.forEach(function (plyr) {
            player.takeCard(plyr, draw(game));
        });
    }
    var drawnCard = drawCardButWild(game);
    deck.add(game.openDeck, drawnCard);
    game.hint = "play a " + drawnCard.sign + " or " + drawnCard.color;

    handleReverse(game, drawnCard);
    handleSkip(game, drawnCard);
    handleDrawTwo(game, drawnCard);
    handleWildCard(game, drawnCard);

    updateLogAfterInitialize(game, drawnCard);
}

var drawCardButWild = function (game) {
    var drawnCard = draw(game);
    if (drawnCard.color == "black") {
        deck.add(game.closedDeck, drawnCard);
        deck.shuffle(game.closedDeck);
        return drawCardButWild(game);
    }
    return drawnCard;
}

var draw = function (game) {
    if (deck.isEmpty(game.closedDeck)) {
        deck.addAll(game.closedDeck, deck.drawAllButLast(game.openDeck));
        deck.shuffle(game.closedDeck);
    }
    return deck.draw(game.closedDeck);
}

var handleReverse = function (game, playedCard) {
    if (playedCard.sign != "Reverse") return;
    game.isInAscendingOrder = !game.isInAscendingOrder;
}

var handleSkip = function (game, playedCard) {
    if (playedCard.sign != "Skip") return;
    nextTurn(game);
}

var handleDrawTwo = function (game, playedCard) {
    if (playedCard.sign != "+2") return;
    game.drawTwoRun++;
    game.hint = "play a Draw Two";
}

var handleWildCard = function (game, playedCard, newColor) {
    if (playedCard.color != "black") {
        game.runningColor = playedCard.color;
        return;
    }
    game.runningColor = newColor;
    if (playedCard.sign == "+4") applyDrawFour(game);
    game.hint = "play any card of " + game.runningColor + " color";
}

var applyDrawFour = function (game) {
    nextTurn(game);
    var plyr = game.players[game.currentPlayerIndex];
    for (var i = 0; i < 4; i++) {
        player.takeCard(plyr, draw(game));
    }
}

var nextTurn = function (game) {
    var increment = game.isInAscendingOrder ? 1 : -1;
    game.currentPlayerIndex = game.currentPlayerIndex + increment + game.players.length;
    game.currentPlayerIndex %= game.players.length;
}

gameModel.drawCard = function (game, plyr) {
    var newCard = draw(game);
    player.takeCard(plyr, newCard);
    updateLogAfterDraw(game);
    return newCard;
}

gameModel.declareUno = function (game, plyr) {
    player.declareUno(plyr);
    game.log.push(plyr.name + " has declared uno\n\t" + getTime());
}

gameModel.catchUno = function (game, caughtPlayer, smartPlayer) {
    if (player.checkUno(caughtPlayer)) {
        player.takeCard(caughtPlayer, draw(game));
        player.takeCard(caughtPlayer, draw(game));
        game.log.push(caughtPlayer.name + " caught by " + smartPlayer.name + "\n\t\t" + getTime());
    }
    else
        game.log.push("catch was not valid on " + caughtPlayer.name + " \n\t\t" + getTime());
}

gameModel.populateResult = function (game, gameResult) {
    gameResult.playerResults = [];
    game.players.forEach(function (plyr) {
        gameResult.playerResults.push(player.generateResult(plyr));
    });
}

gameModel.drawTwoCards = function (game, plyr) {
    for (var i = 0; i < game.drawTwoRun * 2; i++) player.takeCard(plyr, draw(game));
    updateLogAfterDrawTwo(game, plyr);
    game.drawTwoRun = 0;
    game.hint = "play a +2 or " + game.runningColor + " card";
    nextTurn(game);
}

gameModel.moveForwardAsPlayerTookNoActionOnDrawnCard = function (game, plyr) {
    game.log.push("no action played by " + plyr.name + " after draw a card\n\t\t" + getTime());
    nextTurn(game);
}

var getTime = function () {
    return new Date().toString().split(" ")[4]; //current system time
}

var updateLogAfterDraw = function (game) {
    game.log.push('');
}

var updateLogAfterDrawTwo = function (game, plyr) {
    game.log.push(plyr.name + " drew " + game.drawTwoRun * 2 + " " + " cards" + "\n\t\t" + getTime());
}

var updateLogAfterPlay = function (game, plyr, playedCard) {
    var cardDetail = playedCard.color + " " + playedCard.sign;

    cardDetail = playedCard.color == "black" ? playedCard.sign + " and selected " + game.runningColor + " color" : cardDetail;
    game.log.push(plyr.name + " played a " + cardDetail + " \n\t\t" + getTime());
}

var updateLogAfterInitialize = function (game, playedCard) {
    game.log.push("Game starts with " + playedCard.color + " " + playedCard.sign + "\n\t\t" + getTime());
}


gameModel.populate = function (game, snapshot, plyr) {
    player.populateSelf(plyr, snapshot);
    snapshot.myPlayerIndex = game.players.indexOf(plyr);
    var summaries = [];
    game.players.forEach(function (p) {
        summaries.push(player.generateSummary(p));
    });

    snapshot.playerSummaries = summaries;
    snapshot.currentPlayerIndex = game.currentPlayerIndex;
    snapshot.openCard = deck.lookAtLast(game.openDeck);
    snapshot.isInAscendingOrder = game.isInAscendingOrder;
    snapshot.runningColor = game.runningColor;
    snapshot.drawTwoRun = game.drawTwoRun;
    snapshot.currentTurnLog = game.log[game.log.length - 1];

    if (snapshot.currentPlayerIndex == snapshot.myPlayerIndex)
        snapshot.status = game.hint;
    else {
        var currentPlayer = game.players[game.currentPlayerIndex];
        snapshot.status = currentPlayer.name + ' \'s turn';
    }
}

gameModel.playCard = function (game, plyr, playedCard, newColor) {
    player.playCard(plyr, playedCard);
    deck.add(game.openDeck, playedCard);
    game.hint = "play a " + playedCard.sign + " or " + playedCard.color;
    handleReverse(game, playedCard);
    handleSkip(game, playedCard);
    handleDrawTwo(game, playedCard);
    handleWildCard(game, playedCard, newColor);
    nextTurn(game);
    updateLogAfterPlay(game, plyr, playedCard);
}

exports.gameModel = gameModel;