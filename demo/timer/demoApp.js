(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.general', 'angular-svg-round-progress','pascalprecht.translate'])
        .config(function($translateProvider){
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/{part}/locale/{lang}.json'
            })
                .preferredLanguage('en');
        })
        .controller('ctrl',function($scope){
            var countdownTime = 3 * 1000;
            $scope.d = {
                timer: {
                    timeLeft: countdownTime,
                    play: true,
                    config: {
                        max: countdownTime,
                        countDown: true,
                        format: 'tss',
                        radius: 62,
                        color: '#0a9bad',
                        bgcolor: '#e1e1e1'
                    }
                }
            };

            $scope.$watch('d.timer.timeLeft', function(timeLeft) {
                if (timeLeft <= 0) {
                    $scope.d.timer.play = false;
                }
            });
        })
        .run(function ($rootScope, $translate) {
            $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
                $translate.refresh();
            })
        });

})(angular);
