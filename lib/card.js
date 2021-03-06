var card = {};

card.createCard = function (sign, color) {
    return {sign: sign, color: color};
}

card.getPoints = function (card) {
    var points = {"0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
        "Reverse": 20, "Skip": 20, "+2": 20, "+4": 50, "Wild": 50};
    return points[card.sign];

}

card.getCardPack = function (noOfPacks) {
    var cards = [];
    for (var i = 0; i < noOfPacks; i++) {
        var pack = createPack();
        pack.forEach(function (card) {
            cards.push(card);
        });
    }
    return cards;
}

var createPack = function () {
    var pack = [];
    var colors = ["red", "blue", "yellow", "green"];
    colors.forEach(function (color) {
        pack.push(card.createCard("0", color));
        for (var times = 0; times < 2; times++) {
            for (var i = 1; i < 10; i++) {
                pack.push(card.createCard(i.toString(), color));
            }
            pack.push(card.createCard("Reverse", color));
            pack.push(card.createCard("Skip", color));
            pack.push(card.createCard("+2", color));
        }
    });

    for (var times = 0; times < 4; times++) {
        pack.push(card.createCard("Wild", "black"));
        pack.push(card.createCard("+4", "black"));
    }
    return pack;
}

card.canFollowCard = function (card, snapshot) {
    if (snapshot.drawTwoRun != 0)
        return card.sign == '+2';

    if (card.sign == "+4") {
        return handleDraw4(snapshot);
    }
    if (snapshot.openCard.color == "black") {
        return card.color == snapshot.runningColor || card.color == "black";
    }
    if (card.sign == "Wild") return true;

    return card.sign == snapshot.openCard.sign || snapshot.openCard.color == card.color;
}

var handleDraw4 = function (snapshot) {
    for (var i = 0; i < snapshot.myCards.length; i++) {
        var myCard = snapshot.myCards[i];
        if (['+4', 'Wild'].indexOf(myCard.sign) > -1)
            continue;
        if (myCard.color == snapshot.runningColor || myCard.sign == snapshot.openCard.sign) {
            return false;
        }
    }
    return true;
}

exports.card = card;