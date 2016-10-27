(function (angular) {
    'use strict';

    angular.module('demo', ['znk.infra.znkAudioPlayer', 'pascalprecht.translate', 'ngAnimate'])
        .service('ENV', function () {
            this.debug = true;
        })
        .controller('Main', function ($scope) {
            $scope.d = {};
            $scope.d.image = 'znkAudioPlayer.png';
            $scope.d.audio = 'http://dfz02hjbsqn5e.cloudfront.net/toefl_app/audio/q_2185_gd_pa.mp3';

            $scope.d.onAudioEnded = function(){
                alert('audio ended');
            }
        });
})(angular);
