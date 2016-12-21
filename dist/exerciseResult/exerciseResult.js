(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult', [
        'znk.infra.config','znk.infra.utility',
        'znk.infra.exerciseUtility'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv', 'ExerciseStatusEnum',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv, ExerciseStatusEnum) {
            var ExerciseResultSrv = this;

            var EXERCISE_RESULTS_PATH = 'exerciseResults';
            var EXAM_RESULTS_PATH = 'examResults';
            var MODULE_RESULTS_PATH = 'moduleResults';
            var USER_EXERCISE_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/exerciseResults';
            var USER_EXAM_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';
            var USER_EXERCISES_STATUS_PATH = StorageSrv.variables.appUserSpacePath + '/exercisesStatus';
            var USER_MODULE_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/moduleResults';
            var USER_HOMEWORK_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/assignHomework/homework';

            function _getExerciseResultPath(guid) {
                return EXERCISE_RESULTS_PATH + '/' + guid;
            }

            function _getModuleResultPath(guid) {
                return MODULE_RESULTS_PATH + '/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId, exerciseId, guid) {

                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function (user) {
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
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(exerciseResultPath);
                });
            }

            function _getExerciseResultsGuids() {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(USER_EXERCISE_RESULTS_PATH);
                });
            }

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid, examId) {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    var path = _getExamResultPath(guid);
                    return StudentStorageSrv.get(path).then(function (examResult) {
                        var initResultProm = _getInitExamResult(examId, guid);
                        return initResultProm.then(function (initResult) {
                            if (examResult.guid !== guid) {
                                angular.extend(examResult, initResult);
                            } else {
                                UtilitySrv.object.extendWithoutOverride(examResult, initResult);
                            }
                            return examResult;
                        });
                    });
                });
            }

            function _getInitExamResult(examId, guid) {
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function (user) {
                    return {
                        isComplete: false,
                        startedTime: Date.now(),
                        examId: examId,
                        guid: guid,
                        uid: user.uid,
                        sectionResults: {}
                    };
                });
            }

            function _getExamResultsGuids() {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(USER_EXAM_RESULTS_PATH);
                });
            }

            function _calcExerciseResultFields(exerciseResultObj) {

                function _getAvgTime(totalNum, totalTime) {
                    return Math.round(totalNum ? totalTime / totalNum : 0);
                }

                var countCorrect = 0,
                    countWrong = 0,
                    countSkipped = 0,
                    correctTotalTime = 0,
                    wrongTotalTime = 0,
                    skippedTotalTime = 0,
                    dataToSaveObj = {};

                if (exerciseResultObj.questionResults) {
                    var totalTimeSpentOnQuestions = exerciseResultObj.questionResults.reduce(function (previousValue, currResult) {
                        var timeSpentOnQuestion = angular.isDefined(currResult.timeSpent) && !isNaN(currResult.timeSpent) ? currResult.timeSpent : 0;
                        if (currResult.isAnsweredCorrectly) {
                            countCorrect++;
                            correctTotalTime += timeSpentOnQuestion;
                        } else if (angular.isDefined(currResult.userAnswer)) {
                            countWrong++;
                            wrongTotalTime += timeSpentOnQuestion;
                        } else {
                            countSkipped++;
                            skippedTotalTime += timeSpentOnQuestion;
                        }

                        return previousValue + (currResult.timeSpent || 0);
                    }, 0);
                    var questionsNum = exerciseResultObj.questionResults.length;

                    exerciseResultObj.totalQuestionNum = questionsNum;
                    exerciseResultObj.totalAnsweredNum = countWrong + countCorrect;
                    exerciseResultObj.correctAnswersNum = countCorrect;
                    exerciseResultObj.wrongAnswersNum = countWrong;
                    exerciseResultObj.skippedAnswersNum = countSkipped;
                    exerciseResultObj.duration = totalTimeSpentOnQuestions;
                    exerciseResultObj.correctAvgTime = _getAvgTime(countCorrect, correctTotalTime);
                    exerciseResultObj.wrongAvgTime = _getAvgTime(countWrong, wrongTotalTime);
                    exerciseResultObj.skippedAvgTime = _getAvgTime(countSkipped, skippedTotalTime);
                    exerciseResultObj.avgTimePerQuestion = questionsNum ? Math.round(totalTimeSpentOnQuestions / questionsNum) : 0;
                }

                if (exerciseResultObj.isComplete && angular.isUndefined(exerciseResultObj.endedTime)) {
                    exerciseResultObj.endedTime = Date.now();
                }

                var exerciseResultPath = _getExerciseResultPath(exerciseResultObj.guid);
                dataToSaveObj[exerciseResultPath] = exerciseResultObj;

                return _getExercisesStatusData().then(function (exercisesStatusData) {
                    if (!exercisesStatusData[exerciseResultObj.exerciseTypeId]) {
                        exercisesStatusData[exerciseResultObj.exerciseTypeId] = {};
                    }

                    var exerciseNewStatus = exerciseResultObj.isComplete ? ExerciseStatusEnum.COMPLETED.enum : ExerciseStatusEnum.ACTIVE.enum;
                    var exerciseStatusTypeAndExerciseIdPath = [USER_EXERCISES_STATUS_PATH + '/' + exerciseResultObj.exerciseTypeId + '/' + exerciseResultObj.exerciseId];
                    exercisesStatusData[exerciseResultObj.exerciseTypeId][exerciseResultObj.exerciseId] = new ExerciseStatus(exerciseNewStatus, totalTimeSpentOnQuestions);
                    dataToSaveObj[exerciseStatusTypeAndExerciseIdPath] = exercisesStatusData[exerciseResultObj.exerciseTypeId][exerciseResultObj.exerciseId];
                    return {
                        exerciseResult: exerciseResultObj,
                        exercisesStatus: exercisesStatusData,
                        dataToSave: dataToSaveObj
                    };
                });
            }

            function exerciseSaveFn() {
                /* jshint validthis: true */
                return _calcExerciseResultFields(this).then(function (response) {
                    var exerciseResult = response.exerciseResult;
                    var dataToSave = response.dataToSave;
                    var exercisesStatusData = response.exercisesStatus;

                    var getSectionAggregatedDataProm = $q.when();
                    if (exerciseResult.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                        getSectionAggregatedDataProm = ExerciseResultSrv.getExamResult(exerciseResult.examId).then(function (examResult) {
                            var sectionsAggregatedData = _getExamAggregatedSectionsData(examResult, exercisesStatusData);

                            examResult.duration = sectionsAggregatedData.sectionsDuration;

                            if (sectionsAggregatedData.allSectionsCompleted) {
                                examResult.isComplete = true;
                                examResult.endedTime = Date.now();
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            }
                        });
                    }

                    return getSectionAggregatedDataProm.then(function () {
                        return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                            StudentStorageSrv.update(dataToSave);
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

                for (var i = 0, ii = sectionResultsToArr.length; i < ii; i++) {
                    var sectionId = sectionResultsToArr[i];
                    var sectionStatus = sectionExercisesStatus[sectionId] || {};

                    var isSectionComplete = sectionStatus.status === ExerciseStatusEnum.COMPLETED.enum;
                    if (!isSectionComplete) {
                        aggregatedData.allSectionsCompleted = false;
                    }

                    aggregatedData.sectionsDuration += sectionStatus.duration || 0;
                }

                return aggregatedData;
            }

            function _getExercisesStatusData() {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(USER_EXERCISES_STATUS_PATH);
                });
            }

            function ExerciseStatus(status, duration) {
                this.status = status;
                this.duration = duration;
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId, examSectionsNum, dontInitialize) {

                if (!UtilitySrv.fn.isValidNumber(exerciseTypeId) || !UtilitySrv.fn.isValidNumber(exerciseId)) {
                    var errMSg = 'ExerciseResultSrv: exercise type id, exercise id should be number !!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                exerciseTypeId = +exerciseTypeId;
                exerciseId = +exerciseId;

                if (exerciseTypeId === ExerciseTypeEnum.SECTION.enum && !UtilitySrv.fn.isValidNumber(examId)) {
                    var examErrMSg = 'ExerciseResultSrv: exam id should be provided when asking for section result and should' +
                        ' be a number!!!';
                    $log.error(examErrMSg);
                    return $q.reject(examErrMSg);
                }
                examId = +examId;

                var getExamResultProm;
                if (exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                    getExamResultProm = ExerciseResultSrv.getExamResult(examId, dontInitialize);
                }
                return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                    var resultGuid = exerciseResultsGuids[exerciseTypeId] && exerciseResultsGuids[exerciseTypeId][exerciseId];
                    if (!resultGuid) {
                        if (dontInitialize) {
                            return null;
                        }

                        if (!exerciseResultsGuids[exerciseTypeId]) {
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                            var newGuid = UtilitySrv.general.createGuid();

                            var dataToSave = {};

                            exerciseResultsGuids[exerciseTypeId][exerciseId] = newGuid;
                            dataToSave[USER_EXERCISE_RESULTS_PATH] = exerciseResultsGuids;

                            var exerciseResultPath = _getExerciseResultPath(newGuid);
                            var initResultProm = _getInitExerciseResult(exerciseTypeId, exerciseId, newGuid);
                            return initResultProm.then(function (initResult) {
                                dataToSave[exerciseResultPath] = initResult;

                                var setProm;
                                if (getExamResultProm) {
                                    initResult.examId = examId;
                                    setProm = getExamResultProm.then(function (examResult) {
                                        if (examSectionsNum && !examResult.examSectionsNum) {
                                            examResult.examSectionsNum = examSectionsNum;
                                        }

                                        if (!examResult.sectionResults) {
                                            examResult.sectionResults = {};
                                        }
                                        examResult.sectionResults[exerciseId] = newGuid;

                                        var examResultPath = _getExamResultPath(examResult.guid);
                                        dataToSave[examResultPath] = examResult;
                                    });
                                }

                                return $q.when(setProm).then(function () {
                                    return StudentStorageSrv.update(dataToSave);
                                }).then(function (res) {
                                    return res[exerciseResultPath];
                                });
                            });
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function (result) {
                        var initResultProm = _getInitExerciseResult(exerciseTypeId, exerciseId, resultGuid);
                        return initResultProm.then(function (initResult) {
                            if (result.guid !== resultGuid) {
                                angular.extend(result, initResult);
                            } else {
                                UtilitySrv.object.extendWithoutOverride(result, initResult);
                            }
                            return result;
                        });
                    });
                }).then(function (exerciseResult) {
                    if (angular.isObject(exerciseResult)) {
                        exerciseResult.$save = exerciseSaveFn;
                    }
                    return exerciseResult;
                });
            };

            this.getExamResult = function (examId, dontInitialize) {
                if (!UtilitySrv.fn.isValidNumber(examId)) {
                    var errMsg = 'Exam id is not a number !!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }
                examId = +examId;

                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return _getExamResultsGuids().then(function (examResultsGuids) {
                        var examResultGuid = examResultsGuids[examId];
                        if (!examResultGuid) {
                            if (dontInitialize) {
                                return null;
                            }

                            var dataToSave = {};
                            var newExamResultGuid = UtilitySrv.general.createGuid();
                            examResultsGuids[examId] = newExamResultGuid;
                            dataToSave[USER_EXAM_RESULTS_PATH] = examResultsGuids;

                            var examResultPath = _getExamResultPath(newExamResultGuid);
                            var initExamResultProm = _getInitExamResult(examId, newExamResultGuid);
                            return initExamResultProm.then(function (initExamResult) {
                                dataToSave[examResultPath] = initExamResult;

                                return StudentStorageSrv.update(dataToSave).then(function (res) {
                                    return res[examResultPath];
                                });
                            });
                        }

                        return _getExamResultByGuid(examResultGuid, examId);
                    });
                });
            };

            this.getExerciseStatus = function (exerciseType, exerciseId) {
                return _getExercisesStatusData().then(function (exercisesStatusData) {
                    if (!exercisesStatusData[exerciseType] || !exercisesStatusData[exerciseType][exerciseId]) {
                        return new ExerciseStatus(ExerciseStatusEnum.NEW.enum);
                    }
                    return exercisesStatusData[exerciseType][exerciseId];
                });
            };

            this.getExercisesStatusMap = function () {
                return _getExercisesStatusData();
            };

            /* Module Results Functions */
            this.getModuleExerciseResult = function (userId, moduleId, exerciseTypeId, exerciseId, assignContentType, examId) {

                return $q.all([
                    this.getExerciseResult(exerciseTypeId, exerciseId, examId, null, true),
                    _getInitExerciseResult(exerciseTypeId, exerciseId, UtilitySrv.general.createGuid())
                ]).then(function (results) {
                    var exerciseResult = results[0];
                    var initResults = results[1];

                    if (!exerciseResult) {
                        exerciseResult = initResults;
                        exerciseResult.$$path = EXERCISE_RESULTS_PATH + '/' + exerciseResult.guid;
                    }
                    exerciseResult.moduleId = moduleId;
                    exerciseResult.$save = function () {
                        return moduleExerciseSaveFn.call(this, assignContentType);
                    };
                    return exerciseResult;
                });
            };

            function _getAssignContentUserPath(userId, assignContentType) {
                switch (assignContentType) {
                    case 1:
                        return USER_MODULE_RESULTS_PATH.replace('$$uid', userId);
                    case 2:
                        return USER_HOMEWORK_RESULTS_PATH.replace('$$uid', userId);
                }
            }

            this.getModuleResult = function (userId, moduleId, withDefaultResult, withExerciseResults, assignContentType) {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    var userResultsPath = _getAssignContentUserPath(userId, assignContentType);
                    return StudentStorageSrv.get(userResultsPath).then(function (moduleResultsGuids) {
                            var defaultResult = {};
                            var moduleResultGuid = moduleResultsGuids[moduleId];

                            if (!moduleResultGuid) {
                                if (!withDefaultResult) {
                                    return null;
                                } else {
                                    defaultResult = ExerciseResultSrv.getDefaultModuleResult(moduleId, userId);
                                    moduleResultGuid = defaultResult.guid;
                                }
                            }

                            var resultPath = MODULE_RESULTS_PATH + '/' + moduleResultGuid;
                            return StudentStorageSrv.get(resultPath).then(function (moduleResult) {
                                var promArray = [];
                                if (moduleResult.exercise && withExerciseResults) {
                                    angular.forEach(moduleResult.exercise, function (exerciseData) {
                                            //angular.forEach(exerciseResult, function (exerciseResultGuid, exerciseId) {
                                                var prom = ExerciseResultSrv.getModuleExerciseResult(userId, moduleId, exerciseData.exerciseTypeId, exerciseData.exerciseId, assignContentType, moduleResult.moduleId).then(function (exerciseResults) {
                                                    if (exerciseResults) {
                                                        moduleResult.exerciseResults[exerciseData.exerciseTypeId][exerciseData.exerciseId] = exerciseResults;
                                                    }
                                                });
                                                promArray.push(prom);
                                            //});
                                        }
                                    );
                                }

                                return $q.all(promArray).then(function () {
                                    return moduleResult;
                                });
                            });
                        }
                    );
                });
            }
            ;

            this.getUserModuleResultsGuids = function (userId) {
                var userResultsPath = USER_MODULE_RESULTS_PATH.replace('$$uid', userId);
                return InfraConfigSrv.getStudentStorage().then(function (storage) {
                    return storage.get(userResultsPath);
                });
            };

            this.getDefaultModuleResult = function (moduleId, userId) {
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

            this.setModuleResult = function (newResult, moduleId) {
                return this.getUserModuleResultsGuids(newResult.uid).then(function (userGuidLists) {
                    var moduleResultPath = MODULE_RESULTS_PATH + '/' + newResult.guid;
                    if (userGuidLists[moduleId]) {
                        return ExerciseResultSrv.getModuleResult(newResult.uid, newResult.moduleId).then(function (moduleResult) {
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
                    return InfraConfigSrv.getStudentStorage().then(function (storage) {
                        return storage.update(dataToSave).then(function (newResults) {
                            return newResults[moduleResultPath];
                        });
                    });
                });
            };

            this.getExerciseResultByGuid = function (guid) {
                return _getExerciseResultByGuid(guid).then(function (exerciseResult) {
                    exerciseResult.$save = exerciseSaveFn;
                    return exerciseResult;
                });
            };

            function moduleExerciseSaveFn(assignContentType) {

                /* jshint validthis: true */
                return _calcExerciseResultFields(this).then(function (response) {
                    var exerciseResult = response.exerciseResult;
                    var dataToSave = response.dataToSave;
                    var exerciseStatuses = response.exercisesStatus || {};

                    return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                        var exerciseTypeId = exerciseResult.exerciseTypeId;
                        var exerciseId = exerciseResult.exerciseId;

                        if (!exerciseResultsGuids[exerciseTypeId]) {
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        exerciseResultsGuids[exerciseTypeId][exerciseId] = exerciseResult.guid;
                        dataToSave[USER_EXERCISE_RESULTS_PATH] = exerciseResultsGuids;

                        return ExerciseResultSrv.getModuleResult(exerciseResult.uid, exerciseResult.moduleId, undefined, undefined, assignContentType).then(function (moduleResult) {
                            if (!moduleResult.exerciseResults) {
                                moduleResult.exerciseResults = {};
                            }
                            if (!moduleResult.exerciseResults[exerciseTypeId]) {
                                moduleResult.exerciseResults[exerciseTypeId] = {};
                            }

                            moduleResult.exerciseResults[exerciseTypeId][exerciseId] = exerciseResult.guid;

                            if (exerciseStatuses[exerciseTypeId] && exerciseStatuses[exerciseTypeId][exerciseId]) {
                                var exerciseResultsPath = _getExerciseResultPath(exerciseResult.guid);
                                dataToSave[exerciseResultsPath].status = exerciseStatuses[exerciseTypeId][exerciseId].status;
                            }

                            var getSectionAggregatedDataProm = $q.when();   // todo - duplicate code. make as a function.
                            if (exerciseResult.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                                getSectionAggregatedDataProm = ExerciseResultSrv.getExamResult(exerciseResult.moduleId).then(function (examResult) {
                                    var sectionsAggregatedData = _getExamAggregatedSectionsData(examResult, exerciseStatuses);

                                    examResult.duration = sectionsAggregatedData.sectionsDuration;

                                    if (sectionsAggregatedData.allSectionsCompleted) {
                                        examResult.isComplete = true;
                                        examResult.endedTime = Date.now();
                                        var examResultPath = _getExamResultPath(examResult.guid);
                                        dataToSave[examResultPath] = examResult;
                                    }
                                });
                            }

                            moduleResult.lastUpdate = Date.now();
                            var modulePath = _getModuleResultPath(moduleResult.guid);
                            dataToSave[modulePath] = moduleResult;

                            return getSectionAggregatedDataProm.then(function(){
                                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                                    return StudentStorageSrv.update(dataToSave);
                                });
                            });

                        });
                    });
                });
            }
        }
    ]);
})(angular);

angular.module('znk.infra.exerciseResult').run(['$templateCache', function($templateCache) {

}]);
