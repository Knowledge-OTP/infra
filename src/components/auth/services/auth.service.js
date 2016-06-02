(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        function (ENV) {
            'ngInject';

            var authService = {};

            var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

            authService.getAuth = function(){
                return rootRef.getAuth();
            };

            return authService;
        });
})(angular);
