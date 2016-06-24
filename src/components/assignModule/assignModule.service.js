(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', 'ModuleResultsService', '$q',
        function (ZnkModuleService, ModuleResultsService, $q) {
            var userAssignModuleService = {};

            userAssignModuleService.getAssignModules = function () {
                return ZnkModuleService.getHeaders().then(function (moduleHeaders) {
                    var getPromArr = [];
                    angular.forEach(moduleHeaders, function (header) {
                        var getProm = ModuleResultsService.getModuleResult(header.id);
                        getPromArr.push(getProm);
                    });

                    return $q.all(getPromArr).then(function (moduleResults) {
                        var results = {};
                        angular.forEach(moduleResults, function (result) {
                            results[result.moduleId] = result;
                        });
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

