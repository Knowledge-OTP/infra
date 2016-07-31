(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.calls',
        'ngAria',
        'ngMaterial',
        'pascalprecht.translate'
    ])
        .config(function (CallsModalServiceProvider) {
            CallsModalServiceProvider.setBaseTemplatePath('components/calls/modals/templates/baseCallsModal.template.html');

            var isTeacher = localStorage.getItem('isTeacher');

            localStorage.setItem('znkData', 'https://act-dev.firebaseio.com/');
            localStorage.setItem('znkStudentPath', '/act_app');

            if(isTeacher) {
                localStorage.setItem('znkAuthToken', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6ImVlYmUyYjUzLTA4YjctNDI5Ni1iY2ZkLTYyYjY5YjUzMTQ3MyIsImVtYWlsIjoidGVhY2hlcis1NTg4QHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTU1MTk4MH0.lTD8KvalrvncDXYr3PPu884ilFalunv-EIdSTDdmzWo');
                localStorage.setItem('znkPwd', 123456);
                localStorage.setItem('znkUser', 'teacher+5588@zinkerz.com');
            } else {
                localStorage.setItem('znkAuthToken', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6IjIxNzk0ZTJiLTMwNTEtNDAxNi04NDkxLWIzZmU3MGU4MjEyZCIsImVtYWlsIjoidGVzdGVyQHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTUyMTI4N30.hfEgjFMAQ1eAylEOWxSmkBc2ejAZ0KIL2rb6aS5KjLI');
            }
        })
        .run(function ($rootScope) {
            /**
             * to work with storage on act-dev add this to localStorage:
             *     znkAuthToken	  eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6IjIxNzk0ZTJiLTMwNTEtNDAxNi04NDkxLWIzZmU3MGU4MjEyZCIsImVtYWlsIjoidGVzdGVyQHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTUyMTI4N30.hfEgjFMAQ1eAylEOWxSmkBc2ejAZ0KIL2rb6aS5KjLI
             *     znkData   https://act-dev.firebaseio.com/
             *     znkStudentPath	 /act_app
             */
            $rootScope.offline = { isIdleOrOffline: true, receiverId: 1 };

            $rootScope.call = { isIdleOrOffline: false, receiverId: '21794e2b-3051-4016-8491-b3fe70e8212d' };
            $rootScope.called = { isIdleOrOffline: false, receiverId: 'eebe2b53-08b7-4296-bcfd-62b69b531473' };
        })
        .controller('demoCtrl', function ($scope, CallsUiSrv, $rootScope) {

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
        })
        .service('ENV', function () {
            var isTeacher = localStorage.getItem('isTeacher');

            if(isTeacher) {
                // teacher
                this.firebaseAppScopeName = "act_dashboard";
                this.appContext = 'dashboard';
                this.studentAppName = 'act_app';
                this.dashboardAppName = 'act_dashboard';
            } else {
                // student
                this.firebaseAppScopeName = "act_app";
                this.appContext = 'student';
                this.studentAppName = 'act_app';
                this.dashboardAppName = 'act_dashboard';
            }

        }
    );
})(angular);
