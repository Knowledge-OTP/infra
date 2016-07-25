'use strict';

(function (angular) {

    angular.module('znk.infra.calls').directive('activeCall',
        function () {
            return {
                templateUrl: 'components/calls/directives/activeCall/activeCall.template.html',
                scope: {},
                link:function(scope) {
                    scope.teacherName = 'Teacher Name';
                    scope.callDuration = '10:25';
                }
            };
        });

})(angular);
