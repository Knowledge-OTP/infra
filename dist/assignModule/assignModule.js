(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule', ['znk.infra.znkModule', 'znk.infra.moduleResults']);
})(angular);

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

            return userAssignModuleService;
        }
    ]);
})(angular);


angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
