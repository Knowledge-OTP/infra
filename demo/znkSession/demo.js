(function(angular) {
    'use strict';
    angular.module('demo', [
        'demoEnv',
        'pascalprecht.translate',
        'znk.infra.znkSession'
        ])
        .config(function(SessionSrvProvider) {
            SessionSrvProvider.setSessionSubjects( [0, 5] );
        })
        .decorator('ENV', function ($delegate) {
            'ngInject';

            $delegate.liveSession = {
                sessionLength: 55,    // in minutes
                sessionExtendTime: 15, // in minutes
                sessionEndAlertTime: 5 // in minutes
            };
            $delegate.appContext = 'dashboard';
            $delegate.studentAppName = 'sat_app';
            $delegate.dashboardAppName = 'sat_dashboard';
            return $delegate;
        })
        .controller('Main', function (SessionSrv, ActivePanelSrv) {
            'ngInject';
            var vm = this;
            vm.showActiveSessionModal = SessionSrv.showActiveSessionModal;
            ActivePanelSrv.loadActivePanel();
        });
})(angular);
