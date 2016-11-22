(function (angular) {
    'use strict';

    angular.module('demo', [
        'demoEnv',
        'znk.infra.activePanel',
        'znk.infra.calls'
    ])
    .config(function (znkAnalyticsSrvProvider, CallsUiSrvProvider) {
        znkAnalyticsSrvProvider.setEventsHandler(function () {
            return {
                eventTrack: angular.noop,
                timeTrack: angular.noop,
                pageTrack: angular.noop,
                setUsername: angular.noop,
                setUserProperties: angular.noop
            };
        });

        var newFunc = function ($q) {
            'ngInject';
            return function () {
                return $q.when('ofir');

            }
        };
        CallsUiSrvProvider.setCalleeNameFnGetter(newFunc);
    })
    .decorator('StudentContextSrv', function ($delegate) {
        'ngInject';

        $delegate.getCurrUid = function () {
            return 'c47f4f57-521c-4832-b505-c0093737ceff';
        };
        return $delegate;
    })
    .controller('demoCtrl', function ($scope, ActivePanelSrv) {
        ActivePanelSrv.loadActivePanel();
    });
})(angular);
