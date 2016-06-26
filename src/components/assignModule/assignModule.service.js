(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', 'ModuleResultsService', '$q',
        function (ZnkModuleService, ModuleResultsService, $q) {
            var userAssignModuleService = {};

            userAssignModuleService.getAssignModules = function () {
                return ZnkModuleService.getHeaders().then(function (moduleHeaders) {
                    var results = {};
                    var getProm = $q.when();
                    angular.forEach(moduleHeaders, function (header) {
                        getProm = getProm.then(function(){
                            return ModuleResultsService.getModuleResult(header.id).then(function(moduleResult){
                                results[moduleResult.moduleId] = moduleResult;
                            });
                        });
                    });

                    return getProm.then(function () {
                        return {
                            modules: moduleHeaders,
                            results: results
                        };
                    });
                });
            };

            userAssignModuleService.setAssignModules = function (assignModules) {
                var setPromArr = [];
                angular.forEach(assignModules, function (assignModule) {
                    var setProm = ModuleResultsService.setModuleResult(assignModule);
                    setPromArr.push(setProm);
                });

                return $q.all(setPromArr).then(function () {
                    return userAssignModuleService.getAssignModules();
                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);

