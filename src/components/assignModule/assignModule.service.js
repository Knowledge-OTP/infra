(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', 'ModuleResultsService', '$q', 'SubjectEnum',
        function (ZnkModuleService, ModuleResultsService, $q, SubjectEnum) {
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
                    return ZnkModuleService.getModuleHeaders().then(function (moduleHeaders) {
                        var saveProm = $q.when();
                        angular.forEach(moduleIds, function (moduleId) {
                            if(!moduleResults[moduleId]) {
                                moduleResults[moduleId] =  ModuleResultsService.getDefaultModuleResult(moduleId, userId);
                                moduleResults[moduleId].assignedTutorId = tutorId;
                                // copy fields from module object to results object for future using
                                moduleResults[moduleId].name = moduleHeaders[moduleId].name;
                                moduleResults[moduleId].desc = moduleHeaders[moduleId].desc;
                                moduleResults[moduleId].subjectId = moduleHeaders[moduleId].subjectId;
                                moduleResults[moduleId].subjectName = SubjectEnum.getEnumMap()[moduleHeaders[moduleId].subjectId];
                                moduleResults[moduleId].assignDate = Date.now();
                            }
                            moduleResults[moduleId].assign = true;

                            saveProm = saveProm.then(function(){
                                return ModuleResultsService.setModuleResult(moduleResults[moduleId]);
                            });
                        });

                        return saveProm.then(function () {
                            return moduleResults;
                        });
                    });
                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);

