var uno = angular.module('uno-master', []);

uno.controller('masterCtrl', function ($scope, $http) {
    $scope.masterName = "me";
    $scope.noOfPacks = 1;
    $scope.noOfPlayers = 1;
    $scope.gameCreated = false;
    $scope.inUse = false;
    var dataCleared = false;

    $scope.createGame = function () {
        var data = {noOfPacks: $scope.noOfPacks, noOfPlayers: $scope.noOfPlayers, masterName: $scope.masterName};
        $http({method: 'post', url: 'startGame', data: data}).success(function (data) {
            if (data == 'INUSE') {
                $scope.inUse = true;
                return;
            }
            $scope.gameCreated = true;
            $scope.inUse = false;
        });
    };
    $scope.clearData = function () {
        dataCleared = true;
        $http({method: 'post', url: 'gameOver', data: {master: $scope.masterName}});
    };
});
