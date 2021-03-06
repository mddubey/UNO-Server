var deck = {};
var card = require('./card.js').card;

deck.create = function (numberOfPacks) {
    return {cards: card.getCardPack(numberOfPacks)};
};

deck.shuffle = function (dck) {
    dck.cards.sort(function () {
        return 0.5 - Math.random()
    });
};

deck.draw = function (dck) {
    var drawnCards = dck.cards.splice(0, 1);//removes first card
    return  drawnCards[0];
};

deck.add = function (dck, card) {
    dck.cards.push(card);
};

deck.lookAtLast = function (dck) {
    return dck.cards[dck.cards.length - 1];
};

deck.isEmpty = function (dck) {
    return dck.cards.length == 0;
};

deck.addAll = function (dck, newCards) {
    newCards.forEach(function (card) {
        dck.cards.push(card);
    });
};

deck.drawAllButLast = function (dck) {
    return dck.cards.splice(1, dck.cards.length - 1);
};

exports.deck = deck;