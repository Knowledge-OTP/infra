(function (angular) {
    'use strict';

    angular.module('demo', [
        'demoEnv',
        'znk.infra.activePanel'
    ])
        .controller('demoCtrl', function ($scope, ActivePanelSrv) {
            ActivePanelSrv.init();
        })
        .config(function(PresenceServiceProvider){
            // PresenceServiceProvider.setAuthServiceName('AuthService');
        });
})(angular);
