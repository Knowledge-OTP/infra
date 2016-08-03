'use strict';

(function (angular) {

    angular.module('znk.infra.calls').directive('activeCall',
        function ($interval, $filter) {
            return {
                templateUrl: 'components/calls/directives/activeCall/activeCall.template.html',
                scope: {
                    calleeName: '@'
                },
                link:function(scope, element, attrs) {
                    scope.calleeName = attrs.calleeName;
                    var callDuration = 0;
                        $interval(function () {
                        callDuration += 1000;
                        angular.element(element[0].querySelector('.call-duration')).text($filter('formatDuration')(callDuration / 1000, 'mm:ss', true));
                    }, 1000, 0, false);
                }
            };
        });

})(angular);

//     <time>{{12000000 | formatDuration:'Hours: hh, Minutes: mm, Seconds: ss'}}</time></p>
