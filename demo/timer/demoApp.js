(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.general'])
        .controller('ctrl',function($scope){
            var countdownTime = 3 * 1000;
            scope.d = {
                timer: {
                    timeLeft: countdownTime,
                    play: true,
                    config: {
                        max: 3,
                        countDown: true,
                        format: 'tss',
                        radius: 62
                    }
                }
            };

            scope.$watch('d.timer.timeLeft', function(timeLeft) {
                if (timeLeft <= 0) {
                    scope.d.timer.play = false;

                    // HACK: timer drv needs a digest to kill the interval or something. perhaps it's not even its fault!
                    //$timeout(function() {
                    //    genericStatesQuestionCtrl.goToNextState();
                    //});
                }
            });
        });

})(angular);
