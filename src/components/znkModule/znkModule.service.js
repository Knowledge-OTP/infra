(function (angular) {
    'use strict';

    angular.module('znk.infra.znkModule').service('ZnkModuleService', [
        'StorageRevSrv',
        function (StorageRevSrv) {
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

            znkModuleService.setModule = function (module) {
                return StorageRevSrv.update(module);
            };

            return znkModuleService;
        }
    ]);
})(angular);

