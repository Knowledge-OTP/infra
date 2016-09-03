(function (angular) {
    'use strict';

    angular.module('demoEnv',[]).constant('ENV', {
        firebaseAppScopeName: "sat_app",
        fbDataEndPoint: "https://sat-dev.firebaseio.com/",
        appContext: 'student',
        studentAppName: 'sat_app',
        dashboardAppName: 'sat_dashboard',
        videosEndPoint: "//dfz02hjbsqn5e.cloudfront.net/sat_app/",
        mediaEndPoint: "//dfz02hjbsqn5e.cloudfront.net/",
        fbGlobalEndPoint: 'https://znk-dev.firebaseio.com/'
    });
})(angular);
