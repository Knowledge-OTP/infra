(function (angular) {
    'use strict';

    angular.module('znk.infra.auth', ['znk.infra.config', 'znk.infra.storage']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        ["ENV", "$rootScope", "$firebaseAuth", "$window", function (ENV, $rootScope, $firebaseAuth, $window) {
            'ngInject';

            var refAuthDB = new $window.Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
            var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

            var authService = {};
            var fbAuth = $firebaseAuth(refAuthDB);



            authService.getAuth = function(){
                return rootRef.getAuth();
            };

            authService.logout = function () {
                $rootScope.$broadcast('auth:beforeLogout');
                fbAuth.$unauth();

                //var actAuth = $firebaseAuth(rootRef);
                //actAuth.$unauth();
            };
            authService.logout();


            return authService;
        }]);
})(angular);


angular.module('znk.infra.auth').run(['$templateCache', function($templateCache) {

}]);
