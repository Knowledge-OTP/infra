(function (angular) {
    'use strict';

    angular.module('demo', ['znk.infra.znkAudioPlayer', 'pascalprecht.translate'])
        .config(function($translateProvider){
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/{part}/locale/{lang}.json'
            })
                .preferredLanguage('en');
        })
        .service('ENV', function () {
            this.debug = false;
        })
        .controller('Main', function ($scope) {
            $scope.d = {};
            $scope.d.image = 'znkAudioPlayer.png';
            $scope.d.audio = 'http://dfz02hjbsqn5e.cloudfront.net/toefl_app/audio/q_2185_gd_pa.mp3';
        })
        .run(function ($rootScope, $translate) {
            $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
                $translate.refresh();
            })
        });

})(angular);
