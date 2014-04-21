var uno = angular.module('uno-master', []);
var config = {};
config.host = '127.0.0.1:5001/'

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
        // window.close();
    }

    // var window = gui.Window.get();
    // window.on('close', function () {
    //     if ($scope.gameCreated)
    //         $http({method: 'post', url: config.host + 'gameOver', data: {master: $scope.masterName}});
    //     this.close(true);
    // });
});
