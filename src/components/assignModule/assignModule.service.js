(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', 'ModuleResultsService', '$q',
        function (ZnkModuleService, ModuleResultsService, $q) {
            var userAssignModuleService = {};

            userAssignModuleService.setAssignModules = function (assignModules, userId) {
                var setProm = $q.when();
                angular.forEach(assignModules, function (assignModule) {
                    setProm = setProm.then(function(){
                        return ModuleResultsService.setModuleResult(assignModule);
                    });
                });

                return setProm.then(function () {
                    return userAssignModuleService.getUserAssignModules(userId);
                });
            };

            userAssignModuleService.getUserAssignModules = function (userId) {
                return ModuleResultsService.getUserModuleResultsGuids(userId).then(function (resultsGuids) {
                    var moduleResults = {};
                    var getProm = $q.when();
                    angular.forEach(resultsGuids, function (resultGuid) {
                        getProm = getProm.then(function(){
                            return ModuleResultsService.getModuleResultByGuid(resultGuid).then(function(moduleResult){
                                if(moduleResult) {
                                    moduleResults[moduleResult.moduleId] = moduleResult;
                                }
                            });
                        });
                    });

                    return getProm.then(function () {
                        return moduleResults;
                    });
                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);

