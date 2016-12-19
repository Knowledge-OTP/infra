(function(angular) {
    'use strict';
    angular.module('demo', [
        'demoEnv',
        'pascalprecht.translate',
        'znk.infra.liveSession'
        ])
        .config(function () {
            // Replace storageConfig parameters through localStorage
            localStorage.setItem('email', 'ofir+actEdu@zinkerz.com');
            localStorage.setItem('password', '123123');
            localStorage.setItem('dataDbPath', 'https://act-dev.firebaseio.com/');
            localStorage.setItem('studentPath', '/act_app');
            localStorage.setItem('teacherPath', '/act_dashboard');
        })
        .config(function (PresenceServiceProvider, LiveSessionSubjectSrvProvider, znkAnalyticsSrvProvider, CallsUiSrvProvider) {

            PresenceServiceProvider.setAuthServiceName('AuthService');

            LiveSessionSubjectSrvProvider.setLiveSessionSubjects( [0, 5] );

            znkAnalyticsSrvProvider.setEventsHandler(function () {
                return {
                    eventTrack: angular.noop,
                    timeTrack: angular.noop,
                    pageTrack: angular.noop,
                    setUsername: angular.noop,
                    setUserProperties: angular.noop
                };
            });

            var calleeNameFunc = function ($q) {
                'ngInject';
                return function () {
                    return $q.when('Ofir Student');

                }
            };

            CallsUiSrvProvider.setCalleeNameFnGetter(calleeNameFunc);
        })
        .decorator('ENV', function ($delegate) {
            'ngInject';

            $delegate.firebaseAppScopeName = 'act_app';
            $delegate.fbDataEndPoint = '//act-dev.firebaseio.com/';
            $delegate.appContext = 'dashboard';
            $delegate.studentAppName = 'act_app';
            $delegate.dashboardAppName = 'act_dashboard';
            $delegate.videosEndPoint = '//dfz02hjbsqn5e.cloudfront.net/act_app/';
            $delegate.mediaEndPoint = '//dfz02hjbsqn5e.cloudfront.net/';
            $delegate.fbGlobalEndPoint = '//znk-dev.firebaseio.com/';
            $delegate.backendEndpoint = '//znk-web-backend-dev.azurewebsites.net/';
            $delegate.teachworksDataUrl = 'teachworks';
            $delegate.userIdleTime = 30;
            $delegate.idleTimeout = 0;
            $delegate.idleKeepalive = 2;
            $delegate.plivoUsername = "ZinkerzDev160731091034";
            $delegate.plivoPassword = "zinkerz$9999";

            $delegate.liveSession = {
                sessionLength: 45,    // in minutes
                sessionExtendTime: 15, // in minutes
                sessionEndAlertTime: 5 // in minutes
            };

            return $delegate;
        })
        .decorator('StudentContextSrv', function ($delegate) {
            'ngInject';

            $delegate.getCurrUid = function () {
                return 'c47f4f57-521c-4832-b505-c0093737ceff';
            };
            return $delegate;
        })
        .decorator('AuthService', function ($delegate) {
            'ngInject';

            $delegate.getAuth = function () {
                return { uid: 'cf656635-b44c-4fcc-82ef-72fe566d5540' };
            };
            return $delegate;
        })
        .run(function(LiveSessionEventsSrv, ActivePanelSrv){
            'ngInject';
            ActivePanelSrv.loadActivePanel();
            LiveSessionEventsSrv.activate();
        })
        .controller('Main', function ($timeout, TeacherContextSrv, StudentContextSrv) {
            'ngInject';
            var vm = this;

            vm.student = { uid: 'c47f4f57-521c-4832-b505-c0093737ceff' };

            $timeout(function () {
                StudentContextSrv.setCurrentUid('c47f4f57-521c-4832-b505-c0093737ceff');
                TeacherContextSrv.setCurrentUid('cf656635-b44c-4fcc-82ef-72fe566d5540');
            }, 2000);
        });
})(angular);
