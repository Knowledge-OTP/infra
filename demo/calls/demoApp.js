(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.calls'
    ])
        .run(function ($rootScope) {
            /**
             * to work with storage on act-dev add this to localStorage:
             *     znkAuthToken	  eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6IjIxNzk0ZTJiLTMwNTEtNDAxNi04NDkxLWIzZmU3MGU4MjEyZCIsImVtYWlsIjoidGVzdGVyQHppbmtlcnouY29tIn0sImlhdCI6MTQ2OTUyMTI4N30.hfEgjFMAQ1eAylEOWxSmkBc2ejAZ0KIL2rb6aS5KjLI
             *     znkData   https://act-dev.firebaseio.com/
             *     znkStudentPath	 /act_app
             */
            $rootScope.offline = { btnState: 1, receiverId: 1 };
            $rootScope.call = { btnState: 2, receiverId: '9311f0b2-57ea-4374-9817-b70e89b1e174' };
            $rootScope.called = { btnState: 3, receiverId: 1 };
        }).service('ENV', function () {
            this.firebaseAppScopeName = "act_app";
            this.appContext = 'student';
            this.studentAppName = 'act_app';
            this.dashboardAppName = 'act_dashboard';
        }
    );
})(angular);
