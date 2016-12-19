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
                'backendEndpoint': "https://test/",
                'fbDataEndPoint': 'https://znk-dev.firebaseio.com',
                'fbGlobalEndPoint': 'https://znk-dev.firebaseio.com'
            };
        });
})(angular);
