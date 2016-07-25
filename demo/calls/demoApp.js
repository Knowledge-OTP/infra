(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.calls'
    ])
        .run(function ($rootScope) {

            $rootScope.offline = 1;
            $rootScope.call = 2;
            $rootScope.called = 3;
        });
})(angular);
