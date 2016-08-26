
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatter', [
        function () {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatter.template.html',
                scope: {
                    chatterObj: '='
                },
                link: function (scope) {
                    scope.d = {};
                    // mock
                    scope.d.userStatus = {
                        'OFFLINE': 0,
                        'ONLINE': 1,
                        'IDLE': 2
                    };
                    // mock

                }
            };
        }
    ]);
})(angular);

