(function (angular) {
    'use strict';

    var mockENVServiceName = 'ENV';

    angular.module('env.mock', [])
        .service(mockENVServiceName, function () {
            return {
                'firebaseAppScopeName': 'test_app',
                'appContext': 'student',
                'studentAppName': 'test_app',
                'dashboardAppName': 'test_dashboard',
                'supportEmail':'support@zinkerz.com',
                'fbDataEndPoint': 'https://sat-dev.firebaseio.com',
                'fbGlobalEndPoint' : 'https://znk-dev.firebaseio.com'
            };
        });
})(angular);
