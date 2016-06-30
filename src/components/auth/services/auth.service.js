(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        function (ENV) {
            'ngInject';

            var refAuthDB = new Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
            var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

            var authService = {};

            authService.getAuth = function(){
                return rootRef.getAuth();
            };

            authService.logout = function () {
                refAuthDB.unauth();
                rootRef.unauth();
            };

            authService.logout();
            return authService;
        });
})(angular);
