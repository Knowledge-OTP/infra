(function(angular) {
    'use strict';
    angular.module('demo', ['znk.infra.znkQuestionReport'])
        .constant('ENV', {
            firebaseAppScopeName: "sat_app",
            fbDataEndPoint: "https://sat-dev.firebaseio.com/",
            appContext: 'student',
            studentAppName: 'sat_app',
            dashboardAppName: 'demo_dashboard',
            videosEndPoint: "//dfz02hjbsqn5e.cloudfront.net/sat_app/",
            mediaEndPoint: "//dfz02hjbsqn5e.cloudfront.net/",
            fbGlobalEndPoint: 'https://znk-dev.firebaseio.com/',
            backendEndpoint: 'https://znk-web-backend-dev.azurewebsites.net/'
        })
        .controller('Main', function ($scope, ENV) {
            'ngInject';
            var vm = this;
            vm.questionData = {
                questionQUID: '123456789',
                exerciseID: '987654321',
                exerciseTypeID: '3',
                questionID: '65498'
            }
        });
})(angular);
