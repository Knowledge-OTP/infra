(function (angular) {
    'use strict';

    angular.module('demo', [
        'demoEnv',
        'znk.infra.activePanel'
    ])
    .config(function ($translateProvider) {
        'ngInject';
        $translateProvider.preferredLanguage('en');
        $translateProvider.useSanitizeValueStrategy(null);
    })
    .controller('demoCtrl', function ($scope, ActivePanelSrv) {
        ActivePanelSrv.init();
    });
})(angular);
