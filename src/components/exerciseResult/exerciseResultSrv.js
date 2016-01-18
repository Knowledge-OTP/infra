(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv) {
            var ExerciseResultSrv = this;

            var EXAM_RESULTS_PATH = 'examResults';
            var EXAM_RESULTS_GUID_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';
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

            function _getSectionResultGuidPathInExamResult(examId,sectionId){
                return ExerciseResultSrv.getExamResult(examId).then(function(examResult){
                    return _getExamResultPath(examResult.guid) + '/sectionResults/' + sectionId;
                });
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId) {
                var getSectionResultGuidPathInExamResultProm = exerciseTypeId === ExerciseTypeEnum.SECTION.enum ?
                    _getSectionResultGuidPathInExamResult(examId, exerciseId) : null;

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

                        var setProm;
                        if(getSectionResultGuidPathInExamResultProm){
                            setProm = getSectionResultGuidPathInExamResultProm.then(function(sectionResultInExamResultPath){
                                setVal[sectionResultInExamResultPath] = guid;
                                return storage.set(setVal);
                            });
                        }else{
                            setProm = storage.set(setVal);
                        }

                        return setProm.then(function(res){
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

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid,examId) {
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXAM_RESULTS_PATH).then(function(examResults){
                    if(!examResults[guid]){
                        examResults[guid] = _getInitExamResult(examId, guid);
                    }
                    return examResults[guid];
                });
            }

            function _getInitExamResult(examId, guid){
                return {
                    isComplete: false,
                    startedTime: '%currTimeStamp%',
                    examId: examId,
                    guid: guid
                };
            }

            function _getExamResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXAM_RESULTS_GUID_PATH);
            }

            this.getExamResult = function (examId) {
                var storage = InfraConfigSrv.getStorageService();
                return _getExamResultsGuids().then(function (examResultsGuids) {
                    var examResultGuid = examResultsGuids[examId];
                    if (!examResultGuid) {
                        var dataToSave = {};

                        var newExamResultGuid = UtilitySrv.general.createGuid();
                        examResultsGuids[examId] = newExamResultGuid;
                        dataToSave[EXAM_RESULTS_GUID_PATH] = examResultsGuids;

                        var examResultPath = _getExamResultPath(newExamResultGuid);
                        var initExamResult = _getInitExamResult(examId, newExamResultGuid);
                        dataToSave[examResultPath] = initExamResult;

                        return storage.set(dataToSave).then(function (res) {
                            return res[examResultPath];
                        });
                    }

                    return _getExamResultByGuid(examResultGuid, examId);
                });
            };
        }
    ]);
})(angular);
