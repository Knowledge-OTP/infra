(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        function (ENV, $rootScope, $firebaseAuth, $window) {
            'ngInject';

            var refAuthDB = new $window.Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
            //var refDataDB = new $window.Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

            var authService = {};
            var fbAuth = $firebaseAuth(refAuthDB);



            authService.getAuth = function(){
                return rootRef.getAuth();
            };

            authService.logout = function () {
                debugger;
                $rootScope.$broadcast('auth:beforeLogout');
                fbAuth.$unauth();

                //var actAuth = $firebaseAuth(refDataDB);
                //actAuth.$unauth();
            };
            authService.logout();


            return authService;
        });
})(angular);
