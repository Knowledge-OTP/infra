(function (angular) {
    'use strict';
    angular.module('znk.infra.znkModuleResults', ['znk.infra.utility']);
})(angular);

angular.module('znk.infra.znkModuleResults').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkModuleResults').service('ZnkModuleResultsService', [
        'InfraConfigSrv', '$log', '$q', 'StorageSrv', 'UtilitySrv',
        function (InfraConfigSrv, $log, $q, StorageSrv, UtilitySrv) {

            var znkModuleResultsService = {};
            var storage = InfraConfigSrv.getStorageService();
            var MODULE_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/moduleResults';
            var MODULE_RESULTS_PATH = 'moduleResults';

            function _getModuleResultsGuids(){
                return storage.get(MODULE_RESULTS_GUIDS_PATH);
            }

            function _getInitModuleResult(moduleId, guid){
                return $q.when( {
                    "moduleId": moduleId,
                    "assign": false,
                    "contentAssign": false,
                    "date": null,
                    "tutorId": null,
                    guid: guid
                });
            }

            function _getModuleResultByGuid(guid, moduleId) {
                var path = MODULE_RESULTS_PATH + '/' + guid;
                return storage.get(path).then(function(moduleResult){
                    var initResultProm = _getInitModuleResult(moduleId, guid);
                    return initResultProm.then(function(initResult) {
                        if(moduleResult.guid !== guid){
                            angular.extend(moduleResult,initResult);
                        }else{
                            UtilitySrv.object.extendWithoutOverride(moduleResult,initResult);
                        }
                        return moduleResult;
                    });
                });
            }

            znkModuleResultsService.getModuleResult = function (moduleId, dontInitialize) {
                if(!UtilitySrv.isValidNumber(moduleId)){
                    var errMsg = 'Module id is not a number !!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }
                moduleId = +moduleId;
                return _getModuleResultsGuids().then(function (moduleResultsGuids) {
                    var moduleResultGuid = moduleResultsGuids[moduleId];
                    if (!moduleResultGuid) {
                        if(dontInitialize){
                            return null;
                        }

                        var dataToSave = {};
                        var newModuleResultGuid = UtilitySrv.general.createGuid();
                        moduleResultsGuids[moduleId] = newModuleResultGuid;
                        dataToSave[MODULE_RESULTS_GUIDS_PATH] = moduleResultsGuids;

                        var moduleResultPath = MODULE_RESULTS_PATH + '/' + newModuleResultGuid;
                        var initModuleResultProm = _getInitModuleResult(moduleId, newModuleResultGuid);
                        return initModuleResultProm.then(function(initModuleResult) {
                            dataToSave[moduleResultPath] = initModuleResult;

                            return storage.set(dataToSave).then(function (res) {
                                return res[moduleResultPath];
                            });
                        });
                    }

                    return _getModuleResultByGuid(moduleResultGuid, moduleId);
                });
            };

            return znkModuleResultsService;
        }
    ]);
})(angular);

