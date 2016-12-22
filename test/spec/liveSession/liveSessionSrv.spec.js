describe('testing service "LiveSessionSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.liveSession', 'htmlTemplates', 'storage.mock', 'testUtility', 'user.mock', 'env.mock'));

    beforeEach(module('znk.infra.liveSession', function($provide, PresenceServiceProvider, LiveSessionSubjectSrvProvider, znkAnalyticsSrvProvider, CallsUiSrvProvider) {
        localStorage.setItem('email', 'ofir+actEdu@zinkerz.com');
        localStorage.setItem('password', '123123');
        localStorage.setItem('dataDbPath', 'https://act-dev.firebaseio.com/');
        localStorage.setItem('studentPath', '/act_app');
        localStorage.setItem('teacherPath', '/act_dashboard');

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

        $provide.decorator('ENV', function($delegate) {
            $delegate.firebaseAppScopeName = 'act_dashboard';
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
      });
    }));

    var _deps = {};
    beforeEach(inject(function ($injector) {
        var depsToInject = [
            'LiveSessionSrv',
            'UserProfileService',
            'InfraConfigSrv',
            'TestUtilitySrv',
            'UtilitySrv'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.LiveSessionSrv = _deps.TestUtilitySrv.general.convertAllAsyncToSync(_deps.LiveSessionSrv);

        _deps.GlobalStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getGlobalStorage, _deps.InfraConfigSrv)();
    }));

    it('when true then true', function () {
        var result = true;
        expect(result).toEqual(true);
    });

});
