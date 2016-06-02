(function (angular) {
    'use strict';

    var mockENVServiceName = 'ENV';

    angular.module('env.mock', [])
        .service(mockENVServiceName, function(){
             return {
                'firebaseAppScopeName': 'test_app'
             };
        });
})(angular);