(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', 'ModuleResultsService', '$q', '$log',
        function (ZnkModuleService, ModuleResultsService, $q, $log) {
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

            userAssignModuleService.setUserAssignModules = function (moduleIds, userId, tutorId) {
                if(!angular.isArray(moduleIds)){
                    var errMSg = 'UserAssignModuleService: 1st argument should be array of module ids';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                var moduleResults = {};
                var getProm = $q.when();
                angular.forEach(moduleIds, function (moduleId) {
                    getProm = getProm.then(function(){
                        return ModuleResultsService.getModuleResultByModuleId(moduleId, userId, false).then(function (moduleResult) {
                            moduleResults[moduleId] = moduleResult;
                            return moduleResults;
                        });
                    });

                });
                return getProm.then(function () {
                    var saveProm = $q.when();
                    angular.forEach(moduleIds, function (moduleId) {
                        if(!moduleResults[moduleId]) {
                            moduleResults[moduleId] =  ModuleResultsService.getDefaultModuleResult(moduleId, userId);
                            moduleResults[moduleId].assignedTutorId = tutorId;
                        }
                        moduleResults[moduleId].assign = true;

                        saveProm = saveProm.then(function(){
                            return ModuleResultsService.setModuleResult(moduleResults[moduleId]).then(function(savedResults){
                                moduleResults[moduleId] = savedResults;
                            });
                        });
                    });

                    return saveProm.then(function () {
                        return moduleResults;
                    });

                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);

