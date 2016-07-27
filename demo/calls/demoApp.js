(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.calls',
        'ngAria',
        'ngMaterial',
        'pascalprecht.translate',
        'znk.infra.modal'
    ])
        .config(function (ModalServiceProvider) {
            ModalServiceProvider.setBaseTemplatePath('components/calls/modals/templates/baseCallsModal.template.html');
            // components/calls/modals/templates/incomingCall.template.html
        })
        .run(function ($rootScope) {
            /**
             * to work with storage on act-dev add this to localStorage:
             *     znkAuthToken	  eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6IjIxNzk0ZTJiLTMwNTEtNDAxNi04NDkxLWIzZmU3MGU4MjEyZCIsImVtYWlsIjoidGVzdGVyQHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTUyMTI4N30.hfEgjFMAQ1eAylEOWxSmkBc2ejAZ0KIL2rb6aS5KjLI
             *     znkData   https://act-dev.firebaseio.com/
             *     znkStudentPath	 /act_app
             */
            $rootScope.offline = { btnState: 1, receiverId: 1 };

            $rootScope.call = { btnState: 2, receiverId: '21794e2b-3051-4016-8491-b3fe70e8212d' };
            $rootScope.called = { btnState: 2, receiverId: 'eebe2b53-08b7-4296-bcfd-62b69b531473' };
        })
        .controller('demoCtrl', function ($scope, CallsUiSrv, $rootScope) {

            var scope = $rootScope.$new();

            scope.callsData = {};
            scope.callsData.status = 3;

            $scope.openIncomingCallModal = function() {
                CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, scope);
            };

            $scope.openOutgoingCallModal = function() {
                CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, scope);
            };
        })
        .service('ENV', function () {
            // student
             this.firebaseAppScopeName = "act_app";
             this.appContext = 'student';
             this.studentAppName = 'act_app';
             this.dashboardAppName = 'act_dashboard';

            // teacher
            //this.firebaseAppScopeName = "act_dashboard";
            //this.appContext = 'dashboard';
            //this.studentAppName = 'act_app';
            //this.dashboardAppName = 'act_dashboard';
        }
    );
})(angular);
