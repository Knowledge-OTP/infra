(function (angular) {
    'use strict';

    var mockENVServiceName = 'ENV';

    angular.module('env.mock', [])
        .constant(mockENVServiceName, {
                'firebaseAppScopeName': 'test_app',
                'authAppName': 'myzinkerz_app',
                'appContext': 'student',
                'studentAppName': 'test_app',
                'dashboardAppName': 'test_dashboard',
                'supportEmail':'support@zinkerz.com',
                'fbDataEndPoint': 'https://sat-dev.firebaseio.com',
                'fbGlobalEndPoint' : 'https://znk-dev.firebaseio.com',
                'userIdleTime': 30,
                'idleTimeout': 0,
                'idleKeepalive':2,
                'plivoUsername': 'ZinkerzDev160731091034',
                'plivoPassword': 'zinkerz$9999'
        });
})(angular);
