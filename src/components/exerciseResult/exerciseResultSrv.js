(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv) {
            var ExerciseResultSrv = this;

            var EXERCISE_RESULTS_PATH = 'exerciseResults';
            var EXERCISE_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/exerciseResults';


            var EXAM_RESULTS_PATH = 'examResults';
            var EXAM_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';


            //function _getExerciseResultGuidPath(exerciseTypeId, exerciseId) {
            //    var template = EXERCISE_RESULTS_GUIDS_PATH + '/%exerciseType%/%exerciseId%';
            //    return template.replace('%exerciseType%', exerciseTypeId).replace('%exerciseId%', exerciseId);
            //}

            //function _getUserExerciseResultGuid(exerciseTypeId, exerciseId) {
            //    var storage = InfraConfigSrv.getStorageService();
            //    var exerciseResultGuidPath = _getExerciseResultGuidPath(exerciseTypeId, exerciseId);
            //    return storage.get(exerciseResultGuidPath);
            //}

            function _getExerciseResultPath(guid) {
                return EXERCISE_RESULTS_PATH + '/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId,exerciseId,guid){
                var storage = InfraConfigSrv.getStorageService();
                return {
                    exerciseId: exerciseId,
                    exerciseTypeId: exerciseTypeId,
                    startedTime: storage.variables.currTimeStamp,
                    questionResults: [],
                    guid: guid
                };
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(exerciseResultPath);
            }

            //function _getSectionResultGuidPathInExamResult(examId,sectionId){
            //    return ExerciseResultSrv.getExamResult(examId).then(function(examResult){
            //        return _getExamResultPath(examResult.guid) + '/sectionResults/' + sectionId;
            //    });
            //}

            function _getExerciseResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXERCISE_RESULTS_GUIDS_PATH);
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId) {
                var getExamResultProm;
                if(exerciseTypeId === ExerciseTypeEnum.SECTION.enum){
                    getExamResultProm = ExerciseResultSrv.getExamResult(examId);
                }
                return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                    var resultGuid = exerciseResultsGuids[exerciseTypeId] && exerciseResultsGuids[exerciseTypeId][exerciseId];
                    if (!resultGuid) {
                        if(!exerciseResultsGuids[exerciseTypeId]){
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        var storage = InfraConfigSrv.getStorageService();


                        var newGuid = UtilitySrv.general.createGuid();

                        var dataToSave = {};

                        exerciseResultsGuids[exerciseTypeId][exerciseId] = newGuid;
                        dataToSave[EXERCISE_RESULTS_GUIDS_PATH] = exerciseResultsGuids;

                        var exerciseResultPath = _getExerciseResultPath(newGuid);
                        var initResult = _getInitExerciseResult(exerciseTypeId,exerciseId,newGuid);
                        dataToSave[exerciseResultPath] = initResult;

                        var setProm;
                        if(getExamResultProm){
                            setProm = getExamResultProm.then(function(examResult){
                                if(examResult.sectionResults){
                                    examResult.sectionResults = {};
                                }
                                examResult.sectionResults[exerciseId] = newGuid;
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            });
                        }

                        return $q.when(setProm).then(function(){
                            return storage.set(dataToSave);
                        }).then(function(res){
                            return res[exerciseResultPath];
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function(result){
                        if(!result.guid){
                            var initResult = _getInitExerciseResult(exerciseTypeId,exerciseId,newGuid);
                            angular.extend(result,initResult);
                        }
                        return result;
                    });
                });
            };

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid,examId) {
                var storage = InfraConfigSrv.getStorageService();
                var path = _getExamResultPath(guid);
                return storage.get(path).then(function(examResult){
                    if(!examResult[guid]){
                        var initResult = _getInitExamResult(examId, guid);
                        angular.extend(examResult,initResult);
                    }
                    return examResult;
                });
            }

            function _getInitExamResult(examId, guid){
                return {
                    isComplete: false,
                    startedTime: '%currTimeStamp%',
                    examId: examId,
                    guid: guid,
                    sectionResults:{}
                };
            }

            function _getExamResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXAM_RESULTS_GUIDS_PATH);
            }

            this.getExamResult = function (examId) {
                var storage = InfraConfigSrv.getStorageService();
                return _getExamResultsGuids().then(function (examResultsGuids) {
                    var examResultGuid = examResultsGuids[examId];
                    if (!examResultGuid) {
                        var dataToSave = {};

                        var newExamResultGuid = UtilitySrv.general.createGuid();
                        examResultsGuids[examId] = newExamResultGuid;
                        dataToSave[EXAM_RESULTS_GUIDS_PATH] = examResultsGuids;

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
