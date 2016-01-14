(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv',
        function (InfraConfigSrv, $log, $q, UtilitySrv) {
            function _getUserExerciseResultPath(exerciseTypeId, exerciseId){
                var storage = InfraConfigSrv.getStorageService();
                var template = storage.variables.appUserSpacePath + '/exerciseResults/%exerciseType%/%exerciseId%';
                return template.replace('%exerciseType%', exerciseTypeId).replace('%exerciseId%', exerciseId);
            }

            function _getUserExerciseResultGuidPath(exerciseTypeId, exerciseId) {
                var storage = InfraConfigSrv.getStorageService();
                var exerciseResultGuidPath = _getUserExerciseResultPath(exerciseTypeId,exerciseId);
                return storage.get(exerciseResultGuidPath);
            }

            function _getExerciseResultPath(guid){
                return 'exerciseResults/' + guid;
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(exerciseResultPath);
            }

            function _setExerciseResult(exerciseTypeId, exerciseId, result){
                var storage = InfraConfigSrv.getStorageService();
                if(angular.isUndefined(result)){
                    result = {
                        exerciseId: exerciseId,
                        exerciseTypeId: exerciseTypeId,
                        startedTime: storage.variables.currTimeStamp,
                        questionResults: []
                    };
                }
                var guid = UtilitySrv.general.createGuid();
                var setVal = {};

                var userExerciseResultPath = _getUserExerciseResultPath(exerciseTypeId,exerciseId);
                setVal[userExerciseResultPath] = guid;

                var exerciseResultPath = _getExerciseResultPath(guid);
                setVal[exerciseResultPath] = result;

                return storage.set(setVal).then(function(res){
                    return res[exerciseResultPath];
                });
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId) {
                return _getUserExerciseResultGuidPath(exerciseTypeId, exerciseId).then(function (resultGuid) {
                    if (!angular.equals({},resultGuid)) {
                        return _getExerciseResultByGuid(resultGuid).then(function (result) {
                            if (angular.equals(result, {})) {
                                $log.$debug('ExerciseResultSrv: result not exits for the following exercise: ' +
                                    'exerciseTyep', exerciseTypeId, 'Exercise id:', exerciseId);
                                return $q.reject('Result not exits');
                            }
                            return result;
                        });
                    }

                    return _setExerciseResult(exerciseTypeId, exerciseId);
                });
            };

            //function ExerciseResult(resultData, key) {
            //    angular.extend(this, resultData || {});
            //    this.$id = key || StorageSrv.createGuid();
            //}
            //
            //ExerciseResult.prototype.$save = function $save() {
            //    var copyOfThis = angular.copy(this);
            //    copyOfThis.uid = AuthSrv.authentication.uid;
            //
            //    return getResultPointer(this.exerciseTypeId, this.exerciseId).then(function(resultKey) {
            //        var key = resultKey || copyOfThis.$id;
            //        delete copyOfThis.$id;
            //
            //        var path = StorageSrv.appPath.concat(['exerciseResults', key]);
            //
            //        var retValue;
            //        return StorageSrv.set(path, copyOfThis).then(function(savedResult) {
            //            retValue = savedResult;
            //            if (!resultKey) {
            //                return setResultPointer(copyOfThis.exerciseTypeId, copyOfThis.exerciseId, key);
            //            }
            //        }).then(function() {
            //            return retValue;
            //        });
            //    });
            //};
            //
            //function getResultPointer(typeId, id) {
            //    var pointersObjPath = StorageSrv.appUserSpacePath.concat(['exerciseResults']);
            //    return StorageSrv.get(pointersObjPath).then(function(pointersObj) {
            //        if (pointersObj && pointersObj[typeId] && pointersObj[typeId][id]) {
            //            return pointersObj[typeId][id];
            //        }
            //    });
            //}
            //
            //function setResultPointer(typeId, id, key) {
            //    var pointersObjPath = StorageSrv.appUserSpacePath.concat(['exerciseResults']);
            //    return StorageSrv.get(pointersObjPath).then(function(pointersObj) {
            //        pointersObj = pointersObj || {};
            //        pointersObj[typeId] = pointersObj[typeId] || {};
            //        pointersObj[typeId][id] = key;
            //
            //        return StorageSrv.set(pointersObjPath, pointersObj);
            //    });
            //}
            //
            //function exists(typeId, id) {
            //    return getResultPointer(typeId, id).then(function(key) {
            //        return !!key;
            //    });
            //}
            //
            //function get(typeId, id) {
            //    return getResultPointer(typeId, id).then(function(pointerKey) {
            //        return getByKey(pointerKey);
            //    });
            //}
            //
            //function getByKey(key) {
            //    if (!key) {
            //        return new ExerciseResult();
            //    }
            //
            //    return StorageSrv.get(StorageSrv.appPath.concat(['exerciseResults', key])).then(function(result) {
            //        return new ExerciseResult(result, key);
            //    });
            //}

            //return {
            //    get: get,
            //    getByKey: getByKey,
            //    exists: exists
            //};

        }
    ]);
})(angular);
