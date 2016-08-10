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
                    // scope.actions = scope.actions || {};
                    if (!angular.isObject(scope.actions)) {
                        scope.actions = {};
                    }

                    var callDuration = 0,
                        durationToDisplay,
                        timerInterval;

                    scope.calleeName = attrs.calleeName;

                    scope.actions.hideUI = function () {
                        $log.debug('hideUI');
                        element.removeClass('visible');
                    };

                    scope.actions.showUI = function () {
                        $log.debug('showUI');
                        element.addClass('visible');
                    };

                    scope.actions.startTimer = function () {
                        $log.debug('call timer started');
                        timerInterval = $interval(function () {
                            callDuration += 1000;
                            durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                            angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                        }, 1000, 0, false);
                    };

                    scope.actions.stopTimer = function () {
                        $interval.cancel(timerInterval);
                    };

                    scope.actions.screenShareMode = function (isScreenShareMode) {
                        $log.debug('screenShareMode');
                        if (isScreenShareMode) {
                            element.addClass('screen-share-mode');
                        } else {
                            element.removeClass('screen-share-mode');
                        }
                    };

                    scope.actions.callBtnMode = function () {
                        $log.debug('callBtnMode');
                    };

                    scope.actions.screenShareBtnsMode = function () {
                        $log.debug('screenShareBtnsMode');
                    };

                    function destroyTimer() {
                        $interval.cancel(timerInterval);
                        callDuration = 0;
                        durationToDisplay = 0;
                    }

                    element.on('$destroy', function() {
                        destroyTimer();
                    });

                    // scope.iama = 'student';
                    scope.iama = 'teacher';
                }
            };
        });
})(angular);
