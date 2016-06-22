(function (angular) {
    'use strict';

    angular.module('demo', ['znk.infra.znkAudioPlayer'])
        .config(function(){

        })
        .service('ENV', function () {
            this.debug = false;
        })
        .controller('Main', function ($scope) {
            $scope.d = {};
            $scope.d.image = 'znkAudioPlayer.png';
            $scope.d.audio = 'test.mp3';
            $scope.audioEnded = function(){
                alert;
            };
        });

})(angular);
