(function (angular) {
    'use strict';

    angular.module('znk.infra.moduleResults').service('ModuleResultsService',
        function (InfraConfigSrv, $log, $q, UtilitySrv, StorageSrv) {
            'ngInject';

            var moduleResultsService = {};
            var USER_MODULE_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/moduleResults';
            var MODULE_RESULTS_PATH = 'moduleResults';

            moduleResultsService.getDefaultModuleResult = function (moduleId, userId) {
                return {
                    moduleId: moduleId,
                    uid: userId,
                    assignedTutorId: null,
                    assign: false,
                    contentAssign: false,
                    exerciseResults: [],
                    guid: UtilitySrv.general.createGuid()
                };
            };

            moduleResultsService.getUserModuleResultsGuids = function (userId){
                var userResultsPath = USER_MODULE_RESULTS_PATH.replace('$$uid', userId);
                return InfraConfigSrv.getStudentStorage().then(function (storage) {
                    return storage.get(userResultsPath);
                });
            };

            moduleResultsService.getModuleResultByGuid = function (resultGuid, defaultValue) {
                var resultPath = MODULE_RESULTS_PATH + '/' + resultGuid;
                return InfraConfigSrv.getStudentStorage().then(function (storage) {
                    return storage.get(resultPath, defaultValue);
                });
            };

            moduleResultsService.getModuleResultByModuleId = function (moduleId, userId, withDefaultResult) {
                return moduleResultsService.getUserModuleResultsGuids(userId).then(function (moduleResultsGuids) {
                    var defaultResult = {};
                    var moduleResultGuid = moduleResultsGuids[moduleId];

                    if (!moduleResultGuid) {
                        if (!withDefaultResult) {
                            return null;
                        } else {
                            defaultResult =  moduleResultsService.getDefaultModuleResult(moduleId, userId);
                            moduleResultGuid = defaultResult.guid;
                        }
                    }

                    return moduleResultsService.getModuleResultByGuid(moduleResultGuid, defaultResult);
                });
            };

            moduleResultsService.setModuleResult = function (newResult) {
                return moduleResultsService.getUserModuleResultsGuids(newResult.uid).then(function (userGuidLists) {
                    var moduleResultPath = MODULE_RESULTS_PATH + '/' + newResult.guid;
                    if (userGuidLists[newResult.guid]) {
                        return  moduleResultsService.getModuleResultByGuid(newResult.guid).then(function (moduleResult) {
                            angular.extend(moduleResult, newResult);
                            return InfraConfigSrv.getStudentStorage().then(function (storage) {
                                return storage.set(moduleResultPath, moduleResult);
                            });
                        });
                    }

                    userGuidLists[newResult.moduleId] = newResult.guid;
                    var dataToSave = {};
                    dataToSave[USER_MODULE_RESULTS_PATH] = userGuidLists;
                    dataToSave[moduleResultPath] = newResult;
                    return InfraConfigSrv.getStudentStorage().then(function(storage){
                        return storage.set(dataToSave);
                    });
                });
            };

            moduleResultsService.getModuleResultPath = function (guid){
                return MODULE_RESULTS_PATH + '/' + guid;
            };



            return moduleResultsService;
        }
    );
})(angular);

