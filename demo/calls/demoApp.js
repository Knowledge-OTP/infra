(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.calls'
    ])
        .run(function ($rootScope) {
            $rootScope.offline = { btnState: 1, receiverId: 1 };
            $rootScope.call = { btnState: 2, receiverId: 1 };
            $rootScope.called = { btnState: 3, receiverId: 1 };
        });
})(angular);
