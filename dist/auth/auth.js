(function (angular) {
    'use strict';

    angular.module('znk.infra.auth', [
        'znk.infra.config',
        'firebase'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        ["ENV", "$q", function (ENV, $q) {
            'ngInject';

            var refAuthDB = new Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
            var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

            var authService = {};

            authService.getAuth = function() {
                return rootRef.getAuth();
            };

            authService.logout = function () {
                refAuthDB.unauth();
                rootRef.unauth();
            };

            authService.changePassword = function (changePasswordData) {
                var refAuthData = refAuthDB.getAuth();
                if (refAuthData && refAuthData.password) {
                    changePasswordData.email = refAuthData.password.email;
                    return refAuthData.$changePassword(changePasswordData);
                }
                return $q.reject('AuthService changePassword: user auth has no password in firebase!');
            };

            return authService;
        }]);
})(angular);

angular.module('znk.infra.auth').run(['$templateCache', function($templateCache) {

}]);
