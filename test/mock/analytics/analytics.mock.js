(function (angular) {
    'use strict';

    angular.module('analytics.mock', [
        'znk.infra.analytics'
    ])
        .config(function($provide){
            $provide.decorator('znkAnalyticsSrv', function ($delegate) {
                return {
                    getEventsConst: angular.noop,
                    getDebugMode: angular.noop
                };
            })
        });
})(angular);
