(function (angular) {
    'use strict';

    angular.module('znk.infra.auth', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        function () {
            'ngInject';

            var auth = {};

            return auth;
        });
})(angular);


angular.module('znk.infra.auth').run(['$templateCache', function($templateCache) {

}]);
