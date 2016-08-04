'use strict';

(function (angular) {

    angular.module('znk.infra.activePanel').directive('activePanel',
        function ($interval, $filter) {
            return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {
                    calleeName: '@',
                    actions: '='
                },
                link:function(scope, element, attrs) {

                    scope.calleeName = attrs.calleeName;

                    scope.actions.onStatusChange = function () {};

                    scope.actions.hideUI = function () {
                        console.log('hideUI');
                        element.css('visibility', 'hidden');
                    };

                    scope.actions.showUI = function () {
                        console.log('showUI');
                        element.css('visibility', 'visible');
                    };

                    var callDuration = 0;
                    var durationToDisplay;
                    $interval(function () {
                        callDuration += 1000;
                        durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                        angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                    }, 1000, 0, false);
                }
            };
        });

})(angular);
