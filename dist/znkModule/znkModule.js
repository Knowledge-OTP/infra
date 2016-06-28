(function (angular) {
    'use strict';
    angular.module('znk.infra.znkModule', []);
})(angular);

angular.module('znk.infra.znkModule').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkModule').service('ZnkModuleService', [
        'StorageRevSrv',
        function (StorageRevSrv) {
            var znkModuleService = {};

            znkModuleService.getHeaders = function () {
                return StorageRevSrv.getContent({
                    exerciseType: 'moduleheaders'
                });
            };

            znkModuleService.getById = function (moduleId) {
                return StorageRevSrv.getContent({
                    exerciseId: moduleId,
                    exerciseType: 'module'
                });
            };

            return znkModuleService;
        }
    ]);
})(angular);

