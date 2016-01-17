(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv',
        function (InfraConfigSrv, $log, $q, UtilitySrv) {
            function _getExerciseResultGuidPath(exerciseTypeId, exerciseId) {
                var storage = InfraConfigSrv.getStorageService();
                var template = storage.variables.appUserSpacePath + '/exerciseResults/%exerciseType%/%exerciseId%';
                return template.replace('%exerciseType%', exerciseTypeId).replace('%exerciseId%', exerciseId);
            }

            function _getUserExerciseResultGuid(exerciseTypeId, exerciseId) {
                var storage = InfraConfigSrv.getStorageService();
                var exerciseResultGuidPath = _getExerciseResultGuidPath(exerciseTypeId, exerciseId);
                return storage.get(exerciseResultGuidPath);
            }

            function _getExerciseResultPath(guid) {
                return 'exerciseResults/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId,exerciseId){
                var storage = InfraConfigSrv.getStorageService();
                return {
                    exerciseId: exerciseId,
                    exerciseTypeId: exerciseTypeId,
                    startedTime: storage.variables.currTimeStamp,
                    questionResults: []
                };
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(exerciseResultPath);
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId) {
                return _getUserExerciseResultGuid(exerciseTypeId, exerciseId).then(function (resultGuid) {
                    var initResult = _getInitExerciseResult(exerciseTypeId,exerciseId);
                    if (angular.isObject(resultGuid)) {
                        var storage = InfraConfigSrv.getStorageService();

                        var guid = UtilitySrv.general.createGuid();
                        var setVal = {};

                        var userExerciseResultPath = _getExerciseResultGuidPath(exerciseTypeId, exerciseId);
                        setVal[userExerciseResultPath] = guid;

                        var exerciseResultPath = _getExerciseResultPath(guid);
                        setVal[exerciseResultPath] = initResult;

                        return storage.set(setVal).then(function(res){
                            return res[exerciseResultPath];
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function(result){
                        angular.forEach(initResult, function(value,key){
                            if(!result.hasOwnProperty(key)){
                                result[key] = value;
                            }
                        });
                        return result;
                    });
                });
            };

            function _getExamGuidPath(examId) {
                var storage = InfraConfigSrv.getStorageService();
                return storage.variables.appUserSpacePath + '/examResults/' + examId;
            }

            function _getExamResultPath(guid) {
                return 'examResults/' + guid;
            }

            function _getExamResultByGuid(guid) {
                var storage = InfraConfigSrv.getStorageService();
                var path = _getExamResultPath(guid);
                return storage.get(path);
            }

            function _getInitExamResult(examId){
                return {
                    isComplete: false,
                    startedTime: '%currTimeStamp%',
                    examId: examId
                };
            }

            this.getExamResult = function (examId) {
                var storage = InfraConfigSrv.getStorageService();
                var examGuidPath = _getExamGuidPath(examId);
                return storage.get(examGuidPath).then(function (examResultGuid) {
                    var initExamResult = _getInitExamResult(examId);
                    if (angular.equals(examResultGuid, {})) {
                        var newExamResultGuid = UtilitySrv.general.createGuid();
                        var dataToSave = {};
                        dataToSave[examGuidPath] = newExamResultGuid;
                        var examResultPath = _getExamResultPath(newExamResultGuid);
                        dataToSave[examResultPath] = initExamResult;
                        return storage.set(dataToSave).then(function (res) {
                            return res[examResultPath];
                        });
                    }

                    return _getExamResultByGuid(examResultGuid).then(function(result){
                        angular.forEach(initExamResult, function(value,key){
                            if(!result.hasOwnProperty(key)){
                                result[key] = value;
                            }
                        });
                        return result;
                    });
                });
            };
        }
    ]);
})(angular);
