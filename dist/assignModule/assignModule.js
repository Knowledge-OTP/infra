(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule', ['znk.infra.znkModule', 'znk.infra.moduleResults']);
})(angular);

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
                var moduleResults = {};
                var getProm = $q.when();
                angular.forEach(moduleIds, function (moduleId) {
                    getProm = getProm.then(function(){
                        return ModuleResultsService.getModuleResultByModuleId(moduleId, userId, false);
                    });

                });
                return getProm.then(function () {
                    var saveProm = $q.when();
                    angular.forEach(moduleIds, function (moduleId) {
                        if(!moduleResults[moduleId]) {
                            moduleResults[moduleId] =  ModuleResultsService.getDefaultModuleResult(moduleId, userId);
                            moduleResults[moduleId].tutorId = tutorId;
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

            userAssignModuleService.getUserAssignedModulesFull = function (uid) {
                return $q.all([ZnkModuleService.getModuleHeaders(), userAssignModuleService.getUserAssignModules(uid)]).then(function (res) {
                    var modules = objectsObjectToArray(res[0]);
                    var assignedModules = objectsObjectToArray(res[1]);

                    assignedModules.forEach(function (assignedModule) {
                        if (assignedModule.assign) {
                            modules.forEach(function (module) {
                                if (module.id === assignedModule.moduleId) {
                                    angular.extend(assignedModule, module);
                                    assignedModule.subjectName = (getSubjectNameById(module.subjectId)) ? getSubjectNameById(module.subjectId) : '';
                                }
                            });
                        }
                    });
                    return assignedModules;
                });
            };

            function objectsObjectToArray(obj) {
                return Object.keys(obj).map(function (key) { return obj[key]; });
            }

            function getSubjectNameById(subjectId) {
                return SubjectEnum.getEnumMap()[subjectId];
            }

            return userAssignModuleService;
        }
    ]);
})(angular);


angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
