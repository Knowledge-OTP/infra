(function (angular) {
    'use strict';

    angular.module('demo').service('ENV',
        function () {
            this.firebaseAppScopeName = "sat_app";
            this.appContext = 'student';
            this.studentAppName = 'sat_app';
            this.dashboardAppName = 'sat_dashboard';
            this.videosEndPoint = "//dfz02hjbsqn5e.cloudfront.net/sat_app";
        }
    );
})(angular);
