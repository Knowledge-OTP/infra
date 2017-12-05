(function (angular) {
    'use strict';
    angular.module('znk.infra.znkModule', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkModule').service('ZnkModuleService',
        ["StorageRevSrv", function (StorageRevSrv) {
            'ngInject';
            var znkModuleService = {};

            znkModuleService.getModuleHeaders = function () {
                return StorageRevSrv.getContent({
                    exerciseType: 'moduleheaders'
                });
            };

            znkModuleService.getModuleById = function (moduleId) {
                return StorageRevSrv.getContent({
                    exerciseId: moduleId,
                    exerciseType: 'module'
                });
            };

            return znkModuleService;
        }]);
})(angular);


angular.module('znk.infra.znkModule').run(['$templateCache', function ($templateCache) {

}]);
