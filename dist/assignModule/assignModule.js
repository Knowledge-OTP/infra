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

            userAssignModuleService.getModuleHeadersWithAssign = function (userId) {
                return ZnkModuleService.getModuleHeaders().then(function (headers) {
                    var moduleResults = {};
                    var getProm = $q.when();
                    angular.forEach(headers, function (header) {
                        getProm = getProm.then(function(){
                            return ModuleResultsService.getModuleResultByModuleId(header.id, userId, true).then(function(moduleResult){
                                if(moduleResult) {
                                    moduleResults[moduleResult.moduleId] = moduleResult;
                                }
                            });
                        });
                    });

                    return getProm.then(function () {
                        return {
                            moduleHeaders: headers,
                            moduleResults: moduleResults
                        };
                    });
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

            return userAssignModuleService;
        }
    ]);
})(angular);


angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
