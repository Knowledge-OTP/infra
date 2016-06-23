(function (angular) {
    'use strict';
    angular.module('znk.infra.moduleResults', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.moduleResults').service('ModuleResultsService', [
        'InfraConfigSrv', '$log', '$q', 'StorageSrv', 'UtilitySrv',
        function (InfraConfigSrv, $log, $q, StorageSrv, UtilitySrv) {

            var moduleResultsService = {};
            var MODULE_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/moduleResults';
            var MODULE_RESULTS_PATH = 'moduleResults';

            function _isValidNumber(number){
                if(!angular.isNumber(number) && !angular.isString(number)){
                    return false;
                }

                return !isNaN(+number);
            }

            function _getModuleResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(MODULE_RESULTS_GUIDS_PATH);
            }

            function _getInitModuleResult(moduleId, guid){
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function(user) {
                    return {
                        moduleId: moduleId,
                        assign: false,
                        contentAssign: false,
                        date: Date.now(),
                        tutorId: null,
                        guid: guid,
                        uid: user.uid
                    };
                });
            }

            function _getModuleResultByGuid(guid, moduleId) {
                var storage = InfraConfigSrv.getStorageService();
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

            moduleResultsService.getModuleResult = function (moduleId, dontInitialize) {
                if(!_isValidNumber(moduleId)){
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
                        return _getInitModuleResult(moduleId, newModuleResultGuid).then(function(initModuleResult) {
                            dataToSave[moduleResultPath] = initModuleResult;
                            var storage = InfraConfigSrv.getStorageService();
                            return storage.set(dataToSave).then(function (res) {
                                return res[moduleResultPath];
                            });
                        });
                    }

                    return _getModuleResultByGuid(moduleResultGuid, moduleId);
                });
            };

            return moduleResultsService;
        }
    ]);
})(angular);


angular.module('znk.infra.moduleResults').run(['$templateCache', function($templateCache) {

}]);
