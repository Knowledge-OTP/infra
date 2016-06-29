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
            var USER_MODULE_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/moduleResults';
            var MODULE_RESULTS_PATH = 'moduleResults';
            var storage = InfraConfigSrv.getStorageService();

            function _getModuleResultsGuids(userId){
                USER_MODULE_RESULTS_PATH = USER_MODULE_RESULTS_PATH.replace('$$uid', userId);
                return storage.get(USER_MODULE_RESULTS_PATH);
            }

            function _initModuleResultObject(moduleResultsGuids, moduleId, userId){
                var dataToSave = {};
                var newModuleResultGuid = UtilitySrv.general.createGuid();
                moduleResultsGuids[moduleId] = newModuleResultGuid;
                dataToSave[USER_MODULE_RESULTS_PATH] = moduleResultsGuids;
                var moduleResultPath = MODULE_RESULTS_PATH + '/' + newModuleResultGuid;
                dataToSave[moduleResultPath] =  {
                    moduleId: moduleId,
                    assign: false,
                    contentAssign: false,
                    guid: newModuleResultGuid,
                    uid: userId
                };

                return dataToSave;
            }

            function _getModuleResultObjectByGuid(guid) {
                var path = MODULE_RESULTS_PATH + '/' + guid;
                return storage.get(path);
            }

            moduleResultsService.getModuleResult = function (moduleId, userId, dontInitialize) {
                if(!UtilitySrv.fn.isValidNumber(moduleId)){
                    var errMsg = 'Module id is not a number !!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }
                moduleId = +moduleId;

                return _getModuleResultsGuids(userId).then(function (moduleResultsGuids) {
                    var moduleResultGuid = moduleResultsGuids[moduleId];
                    if (!moduleResultGuid) {
                        if(dontInitialize){
                            return null;
                        }

                        var dataToSave = _initModuleResultObject(moduleResultsGuids, moduleId, userId);
                        return storage.set(dataToSave).then(function (res) {
                            // todo: return res[moduleResultPath]
                            //return res[moduleResultPath];
                            return res;
                        });
                    }

                    return _getModuleResultObjectByGuid(moduleResultGuid);
                });
            };

            moduleResultsService.setModuleResult = function (newResult){
                var moduleResultPath = MODULE_RESULTS_PATH + '/' + newResult.guid;
                return storage.set(moduleResultPath, newResult);
            };

            return moduleResultsService;
        }
    ]);
})(angular);


angular.module('znk.infra.moduleResults').run(['$templateCache', function($templateCache) {

}]);
