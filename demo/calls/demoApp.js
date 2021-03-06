(function (angular) {
    'use strict';

    var isTeacher = localStorage.getItem('isTeacher');

    angular.module('demo', [
        'demoEnv',
        'znk.infra.calls',
        'ngAria',
        'ngMaterial',
        'pascalprecht.translate',
        'znk.infra.filters',
        'znk.infra.userContext',
        'znk.infra.presence'
    ])
        .config(function (PresenceServiceProvider, CallsModalServiceProvider, CallsUiSrvProvider) {
            'ngInject';

            PresenceServiceProvider.setAuthServiceName('AuthService');

            CallsModalServiceProvider.setBaseTemplatePath('components/calls/modals/templates/baseCallsModal.template.html');

            localStorage.setItem('znkData', 'https://act-dev.firebaseio.com/');
            localStorage.setItem('znkStudentPath', '/act_app');

            if(isTeacher) {
                localStorage.setItem('znkAuthToken', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6ImVlYmUyYjUzLTA4YjctNDI5Ni1iY2ZkLTYyYjY5YjUzMTQ3MyIsImVtYWlsIjoidGVhY2hlcis1NTg4QHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTU1MTk4MH0.lTD8KvalrvncDXYr3PPu884ilFalunv-EIdSTDdmzWo');
                localStorage.setItem('znkPwd', 123456);
                localStorage.setItem('znkUser', 'teacher+5588@zinkerz.com');
            } else {
                localStorage.setItem('znkAuthToken', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6IjIxNzk0ZTJiLTMwNTEtNDAxNi04NDkxLWIzZmU3MGU4MjEyZCIsImVtYWlsIjoidGVzdGVyQHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTUyMTI4N30.hfEgjFMAQ1eAylEOWxSmkBc2ejAZ0KIL2rb6aS5KjLI');
            }

            var fn = function($q) {
                return function(receiverId, callerId) {
                    console.log('receiverId: ' + receiverId + ' callerId: ' + callerId);
                    return $q.when('fake name');
                }
            };
            CallsUiSrvProvider.setCalleeNameFnGetter(fn);
        })
        .decorator('ENV', function ($delegate) {
            'ngInject';
            var isTeacher = localStorage.getItem('isTeacher');
            $delegate.mediaEndpoint = '//dfz02hjbsqn5e.cloudfront.net';
            $delegate.plivoUsername = 'ZinkerzDev160731091034';
            $delegate.plivoPassword = 'zinkerz$9999';
            if(isTeacher) {
                // teacher
                $delegate.firebaseAppScopeName = "act_dashboard";
                $delegate.appContext = 'dashboard';
                $delegate.studentAppName = 'act_app';
                $delegate.dashboardAppName = 'act_dashboard';
            } else {
                // student
                $delegate.firebaseAppScopeName = "act_app";
                $delegate.appContext = 'student';
                $delegate.studentAppName = 'act_app';
                $delegate.dashboardAppName = 'act_dashboard';
            }
            return $delegate;
        })
        .run(function ($rootScope) {
            /**
             * to work with storage on act-dev add this to localStorage:
             *     znkAuthToken	  eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6IjIxNzk0ZTJiLTMwNTEtNDAxNi04NDkxLWIzZmU3MGU4MjEyZCIsImVtYWlsIjoidGVzdGVyQHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTUyMTI4N30.hfEgjFMAQ1eAylEOWxSmkBc2ejAZ0KIL2rb6aS5KjLI
             *     znkData   https://act-dev.firebaseio.com/
             *     znkStudentPath	 /act_app
             */
            'ngInject';

            $rootScope.offline = { isOffline: true, receiverId: 1 };
            $rootScope.call = { isOffline: false, receiverId: '21794e2b-3051-4016-8491-b3fe70e8212d' };
            $rootScope.called = { isOffline: false, receiverId: 'eebe2b53-08b7-4296-bcfd-62b69b531473' };
        })
        .controller('demoCtrl', function ($scope, CallsUiSrv, $rootScope) {
            'ngInject';

            $scope.openIncomingCallModal = function() {
                var scope = $rootScope.$new();
                scope.callsData = {};
                scope.callsData.status = 2;
                CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, scope);
            };

            $scope.openOutgoingCallModal = function() {
                var scope = $rootScope.$new();
                scope.callsData = {};
                scope.callsData.status = 3;
                CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, scope);
            };

            $scope.openErrorModal = function() {
                var modalData = {
                    errorMessage: 'An error has occured'
                };
                CallsUiSrv.showErrorModal(CallsUiSrv.modals.ERROR, modalData);
            };
        });
})(angular);
