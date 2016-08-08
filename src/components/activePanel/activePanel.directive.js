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

                    var callDuration = 0,
                        durationToDisplay,
                        timerInterval;

                    scope.calleeName = attrs.calleeName;

                    scope.actions.hideUI = function (origin) {
                        $log.debug('hideUI', origin);
                        element.removeClass('visible');
                        if (origin === 'calls') {
                            destroyTimer();
                        }
                    };

                    scope.actions.showUI = function (origin) {
                        $log.debug('showUI', origin);
                        element.addClass('visible');
                        if (origin === 'calls') {
                            startTimer();
                        }
                    };

                    function startTimer() {
                        timerInterval = $interval(function () {
                            callDuration += 1000;
                            durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                            angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                        }, 1000, 0, false);
                    }

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
