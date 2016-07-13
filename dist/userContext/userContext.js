(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext').service('StudentContextSrv', [
        function () {
            var StudentContextSrv = {};

            var _currentStudentUid = '';

            StudentContextSrv.getCurrUid = function () {
                return _currentStudentUid;
            };

            StudentContextSrv.setCurrentUid = function (uid) {
                _currentStudentUid = uid;
            };

            return StudentContextSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.userContext').run(['$templateCache', function($templateCache) {

}]);
