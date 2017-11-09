(function (angular) {
    'use strict';

    angular.module('znk.infra.autofocus', ['znk.infra.enum', 'znk.infra.svgIcon']);
})(angular);

/**
 * the HTML5 autofocus property can be finicky when it comes to dynamically loaded
 * templates and such with AngularJS. Use this simple directive to
 * tame this beast once and for all.
 *
 * Usage:
 * <input type="text" autofocus>
 *
 * License: MIT
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.autofocus')
        .directive('ngAutofocus', ['$timeout', function($timeout) {
            return {
                restrict: 'A',
                link : function(scope, element, attrs) {
                    if(scope.$eval(attrs.ngAutofocus)){
                        $timeout(function() {
                            element[0].focus();
                        }, 0, false);
                    }
                }
            };
        }]);
})(angular);


angular.module('znk.infra.autofocus').run(['$templateCache', function ($templateCache) {

}]);
