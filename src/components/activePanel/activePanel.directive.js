'use strict';

(function (angular) {

    angular.module('znk.infra.activePanel').directive('activePanel',
        function ($interval, $filter, $log) {
            return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {
                    calleeName: '@',
                    actions: '='
                },
                link:function(scope, element, attrs) {

                    scope.actions = scope.actions || {};

                    var callDuration = 0,
                        durationToDisplay,
                        timerInterval;

                    scope.calleeName = attrs.calleeName;

                    scope.actions.hideUI = function () {
                        $log.debug('hideUI');
                        element.removeClass('visible');
                        // if (origin === 'calls') {
                        //     destroyTimer();
                        // }
                    };

                    scope.actions.showUI = function () {
                        $log.debug('showUI');
                        element.addClass('visible');
                        // if (origin === 'calls') {
                        //     startTimer();
                        // }
                    };

                    scope.actions.startTimer = function () {
                        timerInterval = $interval(function () {
                            callDuration += 1000;
                            durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                            angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                        }, 1000, 0, false);
                    };

                    scope.actions.stopTimer = function () {
                        $interval.cancel(timerInterval);
                    };

                    function destroyTimer() {
                        $interval.cancel(timerInterval);
                        callDuration = 0;
                        durationToDisplay = 0;
                    }

                    element.on('$destroy', function() {
                        destroyTimer();
                    });
                }
            };
        });
})(angular);
