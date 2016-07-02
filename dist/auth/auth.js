(function (angular) {
    'use strict';

    angular.module('znk.infra.auth', ['znk.infra.config']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        ["ENV", function (ENV) {
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

            return authService;
        }]);
})(angular);


angular.module('znk.infra.auth').run(['$templateCache', function($templateCache) {

}]);
