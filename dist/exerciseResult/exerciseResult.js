(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult', ['znk.infra.config','znk.infra.utility']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv', 'ExerciseStatusEnum',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv, ExerciseStatusEnum) {
            var ExerciseResultSrv = this;

            var EXERCISE_RESULTS_PATH = 'exerciseResults';
            var EXERCISE_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/exerciseResults';


            var EXAM_RESULTS_PATH = 'examResults';
            var EXAM_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';

            var EXERCISES_STATUS_PATH = StorageSrv.variables.appUserSpacePath + '/exercisesStatus';

            function _isValidNumber(number){
                return angular.isNumber(number) && !isNaN(number);
            }

            function _getExerciseResultPath(guid) {
                return EXERCISE_RESULTS_PATH + '/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId,exerciseId,guid){
                if(!_isValidNumber(exerciseTypeId) || !_isValidNumber(exerciseId)){
                    var errMSg = 'exercise type id and exercise id should be number !!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }

                var storage = InfraConfigSrv.getStorageService();
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function(user) {
                    return {
                        exerciseId: exerciseId,
                        exerciseTypeId: exerciseTypeId,
                        startedTime: storage.variables.currTimeStamp,
                        uid: user.uid,
                        questionResults: [],
                        guid: guid
                    };
                });
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(exerciseResultPath);
            }

            function _getExerciseResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXERCISE_RESULTS_GUIDS_PATH);
            }

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid,examId) {
                var storage = InfraConfigSrv.getStorageService();
                var path = _getExamResultPath(guid);
                return storage.get(path).then(function(examResult){
                    var initResultProm = _getInitExamResult(examId, guid);
                    return initResultProm.then(function(initResult) {
                        if(examResult.guid !== guid){
                            angular.extend(examResult,initResult);
                        }else{
                            UtilitySrv.object.extendWithoutOverride(examResult,initResult);
                        }
                        return examResult;
                    });
                });
            }

            function _getInitExamResult(examId, guid){
                if(!_isValidNumber(examId)){
                    var errMsg = 'Exam id is not a number !!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function(user) {
                    return {
                        isComplete: false,
                        startedTime: '%currTimeStamp%',
                        examId: examId,
                        guid: guid,
                        uid: user.uid,
                        sectionResults:{}
                    };
                });
            }

            function _getExamResultsGuids(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXAM_RESULTS_GUIDS_PATH);
            }

            function exerciseSaveFn(){
                /* jshint validthis: true */
                var exerciseResult = this;
                var getExercisesStatusDataProm = _getExercisesStatusData();
                var dataToSave = {};

                var countCorrect = 0,
                    countWrong = 0,
                    countSkipped = 0,
                    correctTotalTime = 0,
                    wrongTotalTime = 0,
                    skippedTotalTime = 0;

                var totalTimeSpentOnQuestions = exerciseResult.questionResults.reduce(function(previousValue, currResult) {
                    var timeSpentOnQuestion =  angular.isDefined(currResult.timeSpent) && !isNaN(currResult.timeSpent) ? currResult.timeSpent : 0;
                    if (currResult.isAnsweredCorrectly) {
                        countCorrect++;
                        correctTotalTime += timeSpentOnQuestion;
                    }else if (angular.isDefined(currResult.userAnswer)) {
                        countWrong++;
                        wrongTotalTime += timeSpentOnQuestion;
                    } else {
                        countSkipped++;
                        skippedTotalTime += timeSpentOnQuestion;
                    }

                    return previousValue + (currResult.timeSpent || 0);
                },0);

                function _getAvgTime(totalNum, totalTime){
                    var avgTime = Math.round(totalNum ? totalTime/totalNum : 0);
                    return avgTime;
                }

                exerciseResult.duration = totalTimeSpentOnQuestions;
                exerciseResult.correctAvgTime = _getAvgTime(countCorrect,correctTotalTime);
                exerciseResult.wrongAvgTime = _getAvgTime(countWrong, wrongTotalTime);
                exerciseResult.skippedAvgTime = _getAvgTime(countSkipped, skippedTotalTime);
                exerciseResult.correctAnswersNum = countCorrect;
                exerciseResult.wrongAnswersNum = countWrong;
                exerciseResult.skippedAnswersNum = countSkipped;

                if(exerciseResult.isComplete && angular.isUndefined(exerciseResult.endedTime)){
                    exerciseResult.endedTime = Date.now();
                }

                var numOfAnsweredQuestions = exerciseResult.questionResults.length;
                exerciseResult.avgTimePerQuestion = numOfAnsweredQuestions ? Math.round(totalTimeSpentOnQuestions / numOfAnsweredQuestions) : 0;
                var exerciseResultPath = _getExerciseResultPath(exerciseResult.guid);

                dataToSave[exerciseResultPath] = exerciseResult;

                return getExercisesStatusDataProm.then(function(exercisesStatusData){
                    if(!exercisesStatusData[exerciseResult.exerciseTypeId]){
                        exercisesStatusData[exerciseResult.exerciseTypeId] = {};
                    }

                    var exerciseNewStatus = exerciseResult.isComplete ?
                        ExerciseStatusEnum.COMPLETED.enum : ExerciseStatusEnum.ACTIVE.enum;
                    exercisesStatusData[exerciseResult.exerciseTypeId][exerciseResult.exerciseId] = new ExerciseStatus(exerciseNewStatus);
                    dataToSave[EXERCISES_STATUS_PATH] = exercisesStatusData;

                    var checkIfALlSectionsDoneProm = $q.when();
                    if(exerciseNewStatus === ExerciseStatusEnum.COMPLETED.enum && exerciseResult.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                        checkIfALlSectionsDoneProm = ExerciseResultSrv.getExamResult(exerciseResult.examId).then(function(examResult) {
                            if(areAllSectionCompleted(examResult,exercisesStatusData)){
                                examResult.isComplete = true;
                                examResult.endedTime = StorageSrv.variables.currTimeStamp;
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            }
                        });
                    }

                    return checkIfALlSectionsDoneProm.then(function() {
                        var storage = InfraConfigSrv.getStorageService();
                        storage.set(dataToSave);

                        return exerciseResult;
                    });

                });
            }

            function areAllSectionCompleted(examResult, exercisesStatusData) {
                var sectionExercisesStatus = exercisesStatusData[ExerciseTypeEnum.SECTION.enum];
                var sectionResultsToArr = Object.keys(examResult.sectionResults);

                if(sectionResultsToArr.length !== +examResult.examSectionsNum) {
                    return false;
                }

                for(var i = 0, ii = sectionResultsToArr.length; i < ii; i++) {
                    var sectionId = sectionResultsToArr[i];
                    var isSectionComplete = sectionExercisesStatus[sectionId].status === ExerciseStatusEnum.COMPLETED.enum;
                    if(!isSectionComplete){
                        return false;
                    }
                }

                return true;
            }

            function _getExercisesStatusData(){
                var storage = InfraConfigSrv.getStorageService();
                return storage.get(EXERCISES_STATUS_PATH);
            }

            function ExerciseStatus(status){
                this.status = status;
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId, examSectionsNum, dontInitialize) {
                var getExamResultProm;
                if(exerciseTypeId === ExerciseTypeEnum.SECTION.enum){
                    getExamResultProm = ExerciseResultSrv.getExamResult(examId, dontInitialize);
                }
                return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                    var resultGuid = exerciseResultsGuids[exerciseTypeId] && exerciseResultsGuids[exerciseTypeId][exerciseId];
                    if (!resultGuid) {
                        if(dontInitialize){
                            return null;
                        }

                        if(!exerciseResultsGuids[exerciseTypeId]){
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        var storage = InfraConfigSrv.getStorageService();


                        var newGuid = UtilitySrv.general.createGuid();

                        var dataToSave = {};

                        exerciseResultsGuids[exerciseTypeId][exerciseId] = newGuid;
                        dataToSave[EXERCISE_RESULTS_GUIDS_PATH] = exerciseResultsGuids;

                        var exerciseResultPath = _getExerciseResultPath(newGuid);
                        var initResultProm = _getInitExerciseResult(exerciseTypeId,exerciseId,newGuid);
                        return initResultProm.then(function(initResult) {
                            dataToSave[exerciseResultPath] = initResult;

                            var setProm;
                            if(getExamResultProm){
                                initResult.examId = examId;
                                setProm = getExamResultProm.then(function(examResult){
                                    if(!examResult.sectionResults){
                                        examResult.sectionResults = {};
                                    }
                                    if(examSectionsNum && !examResult.examSectionsNum) {
                                        examResult.examSectionsNum = examSectionsNum;
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
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function(result){
                        var initResultProm = _getInitExerciseResult(exerciseTypeId,exerciseId,resultGuid);
                        return initResultProm.then(function(initResult) {
                            if(result.guid !== resultGuid){
                                angular.extend(result,initResult);
                            }else{
                                UtilitySrv.object.extendWithoutOverride(result, initResult);
                            }
                            return result;
                        });
                    });
                }).then(function(exerciseResult){
                    if(angular.isObject(exerciseResult)){
                        exerciseResult.$save = exerciseSaveFn;
                    }
                    return exerciseResult;
                });
            };

            this.getExamResult = function (examId, dontInitialize) {
                var storage = InfraConfigSrv.getStorageService();
                return _getExamResultsGuids().then(function (examResultsGuids) {
                    var examResultGuid = examResultsGuids[examId];
                    if (!examResultGuid) {
                        if(dontInitialize){
                            return null;
                        }

                        var dataToSave = {};
                        var newExamResultGuid = UtilitySrv.general.createGuid();
                        examResultsGuids[examId] = newExamResultGuid;
                        dataToSave[EXAM_RESULTS_GUIDS_PATH] = examResultsGuids;

                        var examResultPath = _getExamResultPath(newExamResultGuid);
                        var initExamResultProm = _getInitExamResult(examId, newExamResultGuid);
                        return initExamResultProm.then(function(initExamResult) {
                            dataToSave[examResultPath] = initExamResult;

                            return storage.set(dataToSave).then(function (res) {
                                return res[examResultPath];
                            });
                        });
                    }

                    return _getExamResultByGuid(examResultGuid, examId);
                });
            };

            this.getExerciseStatus = function(exerciseType, exerciseId){
                return _getExercisesStatusData().then(function(exercisesStatusData){
                    if(!exercisesStatusData[exerciseType] || !exercisesStatusData[exerciseType][exerciseId]){
                        return new ExerciseStatus(ExerciseStatusEnum.NEW.enum);
                    }
                    return exercisesStatusData[exerciseType][exerciseId];
                });
            };

            this.getExercisesStatusMap = function(){
                return _getExercisesStatusData();
            };
        }
    ]);
})(angular);

angular.module('znk.infra.exerciseResult').run(['$templateCache', function($templateCache) {

}]);
