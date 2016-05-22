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
                if(!angular.isNumber(number) && !angular.isString(number)){
                    return false;
                }

                return !isNaN(+number);
            }

            function _getExerciseResultPath(guid) {
                return EXERCISE_RESULTS_PATH + '/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId,exerciseId,guid){
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function(user) {
                    return {
                        exerciseId: exerciseId,
                        exerciseTypeId: exerciseTypeId,
                        startedTime: Date.now(),
                        uid: user.uid,
                        questionResults: [],
                        guid: guid
                    };
                });
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(exerciseResultPath);
                });
            }

            function _getExerciseResultsGuids(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(EXERCISE_RESULTS_GUIDS_PATH);
                });
            }

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid,examId) {
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    var path = _getExamResultPath(guid);
                    return StudentStorageSrv.get(path).then(function(examResult){
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
                });
            }

            function _getInitExamResult(examId, guid){
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function(user) {
                    return {
                        isComplete: false,
                        startedTime: Date.now(),
                        examId: examId,
                        guid: guid,
                        uid: user.uid,
                        sectionResults:{}
                    };
                });
            }

            function _getExamResultsGuids(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(EXAM_RESULTS_GUIDS_PATH);
                });
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
                    exercisesStatusData[exerciseResult.exerciseTypeId][exerciseResult.exerciseId] = new ExerciseStatus(exerciseNewStatus, totalTimeSpentOnQuestions);
                    dataToSave[EXERCISES_STATUS_PATH] = exercisesStatusData;

                    var getSectionAggregatedDataProm = $q.when();
                    if(exerciseResult.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                        getSectionAggregatedDataProm = ExerciseResultSrv.getExamResult(exerciseResult.examId).then(function(examResult) {
                            var sectionsAggregatedData = _getExamAggregatedSectionsData(examResult, exercisesStatusData);

                            examResult.duration = sectionsAggregatedData.sectionsDuration;

                            if(sectionsAggregatedData.allSectionsCompleted){
                                examResult.isComplete = true;
                                examResult.endedTime = Date.now();
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            }
                        });
                    }

                    return getSectionAggregatedDataProm.then(function() {
                        return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                            StudentStorageSrv.set(dataToSave);
                            return exerciseResult;
                        });
                    });

                });
            }

            function _getExamAggregatedSectionsData(examResult, exercisesStatusData) {
                var aggregatedData = {
                    sectionsDuration: 0
                };

                var sectionExercisesStatus = exercisesStatusData[ExerciseTypeEnum.SECTION.enum];
                var sectionResultsToArr = Object.keys(examResult.sectionResults);

                var areAllExamSectionsHasResults = sectionResultsToArr.length === +examResult.examSectionsNum;
                aggregatedData.allSectionsCompleted = areAllExamSectionsHasResults;

                for(var i = 0, ii = sectionResultsToArr.length; i < ii; i++) {
                    var sectionId = sectionResultsToArr[i];
                    var sectionStatus =  sectionExercisesStatus[sectionId] || {};

                    var isSectionComplete = sectionStatus.status === ExerciseStatusEnum.COMPLETED.enum;
                    if(!isSectionComplete){
                        aggregatedData.allSectionsCompleted = false;
                    }

                    aggregatedData.sectionsDuration += sectionStatus.duration || 0;
                }

                return aggregatedData;
            }

            function _getExercisesStatusData(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(EXERCISES_STATUS_PATH);
                });
            }

            function ExerciseStatus(status, duration){
                this.status = status;
                this.duration = duration;
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId, examSectionsNum, dontInitialize) {
                if(!_isValidNumber(exerciseTypeId) || !_isValidNumber(exerciseId)){
                    var errMSg = 'ExerciseResultSrv: exercise type id, exercise id should be number !!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                exerciseTypeId = +exerciseTypeId;
                exerciseId = +exerciseId;

                if(exerciseTypeId === ExerciseTypeEnum.SECTION.enum && !_isValidNumber(examId)){
                    var examErrMSg = 'ExerciseResultSrv: exam id should be provided when asking for section result and should' +
                        ' be a number!!!';
                    $log.error(examErrMSg);
                    return $q.reject(examErrMSg);
                }
                examId = +examId;

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

                        return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
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
                                        if(examSectionsNum && !examResult.examSectionsNum) {
                                            examResult.examSectionsNum = examSectionsNum;
                                        }

                                        if(!examResult.sectionResults){
                                            examResult.sectionResults = {};
                                        }
                                        examResult.sectionResults[exerciseId] = newGuid;

                                        var examResultPath = _getExamResultPath(examResult.guid);
                                        dataToSave[examResultPath] = examResult;
                                    });
                                }

                                return $q.when(setProm).then(function(){
                                    return StudentStorageSrv.set(dataToSave);
                                }).then(function(res){
                                    return res[exerciseResultPath];
                                });
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
                if(!_isValidNumber(examId)){
                    var errMsg = 'Exam id is not a number !!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }
                examId = +examId;

                var storage = InfraConfigSrv.getStudentStorage();
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
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

                                return StudentStorageSrv.set(dataToSave).then(function (res) {
                                    return res[examResultPath];
                                });
                            });
                        }

                        return _getExamResultByGuid(examResultGuid, examId);
                    });
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
