(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', 'ModuleResultsService', '$q',
        function (ZnkModuleService, ModuleResultsService, $q) {
            var userAssignModuleService = {};

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

            userAssignModuleService.setAssignModules = function (assignModules, userId) {
                var setPromArr = [];
                angular.forEach(assignModules, function (assignModule) {
                    var setProm = ModuleResultsService.setModuleResult(assignModule);
                    setPromArr.push(setProm);
                });

                return $q.all(setPromArr).then(function () {
                    return userAssignModuleService.getUserAssignModules(userId);
                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);

