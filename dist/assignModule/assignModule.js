(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule', ['znk.infra.znkModule', 'znk.infra.exerciseResult', 'znk.infra.userContext']);
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', '$q', 'SubjectEnum', 'ExerciseResultSrv', 'ExerciseStatusEnum', 'ExerciseTypeEnum', 'EnumSrv', '$log', 'InfraConfigSrv', 'StudentContextSrv',
        function (ZnkModuleService, $q, SubjectEnum, ExerciseResultSrv, ExerciseStatusEnum, ExerciseTypeEnum, EnumSrv, $log, InfraConfigSrv, StudentContextSrv) {
            var userAssignModuleService = {};
            var registerEvents = {};
            userAssignModuleService.assignModules = {};

            userAssignModuleService.assignModuleStatus = new EnumSrv.BaseEnum([
                ['UNLOCKED', ExerciseStatusEnum.NEW.enum, 'unlocked'],
                ['IN-PROGRESS', ExerciseStatusEnum.ACTIVE.enum, 'in progress'],
                ['COMPLETED', ExerciseStatusEnum.COMPLETED.enum, 'completed']
            ]);

            userAssignModuleService.offExternalOnValue = function (userId, valueCB, changeCB) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    studentStorage.offEvent('value', 'users/' + userId + '/moduleResults', onValueEventCB);
                    angular.forEach(registerEvents[userId].valueCB, function (cb, index) {
                        if (cb === valueCB) {
                            registerEvents[userId].valueCB.splice(index, 1);
                        }
                    });

                    if (registerEvents[userId].changeCB) {
                        angular.forEach(registerEvents[userId].changeCB, function (cbData, index) {
                            if (cbData.cb === changeCB) {
                                angular.forEach(cbData.guids, function (resultGuid) {
                                    studentStorage.offEvent('child_changed', 'moduleResults/' + resultGuid, onModuleResultChangedCB);
                                });
                                registerEvents[userId].changeCB.splice(index, 1);
                            }
                        });
                    }
                });
            };

            userAssignModuleService.registerExternalOnValueCB = function (userId, valueCB, changeCB) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    if (!registerEvents[userId]) {
                        registerEvents[userId] = {};
                    }

                    if (!registerEvents[userId].valueCB) {
                        registerEvents[userId].valueCB = [];
                    }
                    registerEvents[userId].valueCB.push(valueCB);

                    if (!registerEvents[userId].changeCB) {
                        registerEvents[userId].changeCB = [];
                    }
                    registerEvents[userId].changeCB.push({
                        cb: changeCB,
                        guids: []
                    });


                    studentStorage.onEvent('value', 'users/' + userId + '/moduleResults', onValueEventCB);
                });
            };

            userAssignModuleService.setUserAssignModules = function (moduleIds, userId, tutorId) {
                if (!angular.isArray(moduleIds)) {
                    var errMSg = 'UserAssignModuleService: 1st argument should be array of module ids';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                var moduleResults = {};
                var getProm = $q.when();
                angular.forEach(moduleIds, function (moduleId) {
                    getProm = getProm.then(function () {
                        return ExerciseResultSrv.getModuleResult(userId, moduleId, false, false).then(function (moduleResult) {
                            moduleResults[moduleId] = moduleResult;
                            return moduleResults;
                        });
                    });

                });
                return getProm.then(function () {
                    var saveProm = $q.when();
                    angular.forEach(moduleIds, function (moduleId) {
                        saveProm = saveProm.then(function () {
                            return ZnkModuleService.getModuleById(moduleId).then(function (moduleObj) {
                                if (!moduleResults[moduleId]) {
                                    moduleResults[moduleId] = ExerciseResultSrv.getDefaultModuleResult(moduleId, userId);
                                    moduleResults[moduleId].assignedTutorId = tutorId;
                                    // copy fields from module object to results object for future using
                                    moduleResults[moduleId].name = moduleObj.name;
                                    moduleResults[moduleId].desc = moduleObj.desc;
                                    moduleResults[moduleId].subjectId = moduleObj.subjectId;
                                    moduleResults[moduleId].order = moduleObj.order;
                                    moduleResults[moduleId].exercises = moduleObj.exercises;
                                    moduleResults[moduleId].assignDate = Date.now();
                                }
                                moduleResults[moduleId].assign = true;
                                return ExerciseResultSrv.setModuleResult(moduleResults[moduleId], moduleId);
                            });
                        });
                    });

                    return saveProm.then(function () {
                        return moduleResults;
                    });
                });
            };

            userAssignModuleService.setAssignContent = function (userId, moduleId) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId).then(function (moduleResult) {
                    moduleResult.contentAssign = true;
                    return ExerciseResultSrv.setModuleResult(moduleResult, moduleId);
                });
            };

            function onValueEventCB(moduleResultsGuids) {
                if (angular.isUndefined(moduleResultsGuids) || !moduleResultsGuids) {
                    var userId = StudentContextSrv.getCurrUid();
                    userAssignModuleService.assignModules = {};
                    applyCB(registerEvents[userId].valueCB);
                    return;
                }
                buildResultsFromGuids(moduleResultsGuids);
            }

            function buildResultsFromGuids(moduleResultsGuids) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    var moduleResults = {};
                    var getProm = $q.when();
                    var getPromArr = [];
                    var userId = StudentContextSrv.getCurrUid();

                    angular.forEach(moduleResultsGuids, function (resultGuid, moduleId) {
                        getProm = getResultsByModuleId(userId, moduleId).then(function (moduleResult) {
                            moduleResults[moduleResult.moduleId] = moduleResult;

                            angular.forEach(registerEvents[userId].changeCB, function (cbData) {
                                if (cbData.guids.indexOf(moduleResult.guid) === -1) {
                                    cbData.guids.push(moduleResult.guid);
                                    studentStorage.onEvent('child_changed', 'moduleResults/' + moduleResult.guid, onModuleResultChangedCB);
                                }
                            });
                        });
                        getPromArr.push(getProm);
                    });

                    $q.all(getPromArr).then(function () {
                        userAssignModuleService.assignModules = moduleResults;
                        applyCB(registerEvents[userId].valueCB);
                    });
                });
            }

            function getResultsByModuleId(userId, moduleId) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId, false, true).then(function (moduleResult) {
                    return ExerciseResultSrv.getExercisesStatusMap().then(function (userExerciseStatus) {
                        if (moduleResult && !angular.equals(moduleResult, {})) {
                            moduleResult.moduleSummary = getModuleSummary(moduleResult, userExerciseStatus);

                            InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                                angular.forEach(moduleResult.exerciseResults, function (exerciseTypeId) {
                                    angular.forEach(exerciseTypeId, function (exercise) {
                                        var exerciseResultsPath = 'exerciseResults/' + exercise.guid;
                                        studentStorage.getAndBindToServer(exerciseResultsPath);
                                    });
                                });
                            });
                        }
                        return moduleResult;
                    });
                });
            }

            function onModuleResultChangedCB() {
                var userId = StudentContextSrv.getCurrUid();
                ExerciseResultSrv.getUserModuleResultsGuids(userId).then(function (moduleResultsGuids) {
                    buildResultsFromGuids(moduleResultsGuids);
                });
            }

            function applyCB(cbArr) {
                angular.forEach(cbArr, function (valueCB) {
                    if (angular.isFunction(valueCB)) {
                        valueCB(userAssignModuleService.assignModules);
                    }
                });
            }

            function getModuleSummary(assignModule, userExerciseStatus) {
                var moduleSummary = {};
                var _exerciseResults = assignModule.exerciseResults;

                function newSummary() {
                    return {
                        status: ExerciseStatusEnum.NEW.enum,
                        correctAnswersNum: 0,
                        wrongAnswersNum: 0,
                        skippedAnswersNum: 0,
                        totalAnswered: 0,
                        duration: 0
                    };
                }
                function newOverAll() {
                    return {
                        status: ExerciseStatusEnum.NEW.enum,
                        totalCorrectAnswers: 0,
                        totalWrongAnswers: 0,
                        totalSkippedAnswers: 0
                    };
                }


                if (assignModule.exercises && assignModule.exercises.length) {
                    var exCompletedCount = 0;
                    var exLectureCount = 0;
                    angular.forEach(assignModule.exercises, function (exercise) {
                        if (!moduleSummary[exercise.exerciseTypeId]){
                            moduleSummary[exercise.exerciseTypeId] = {};
                        }

                        if (!moduleSummary[exercise.exerciseTypeId][exercise.exerciseId]){
                            moduleSummary[exercise.exerciseTypeId][exercise.exerciseId] = newSummary();
                        }

                        var _summary = moduleSummary[exercise.exerciseTypeId][exercise.exerciseId];
                        if (_exerciseResults && _exerciseResults[exercise.exerciseTypeId]) {
                            if (_exerciseResults[exercise.exerciseTypeId][exercise.exerciseId]){
                                if(userExerciseStatus && userExerciseStatus[exercise.exerciseTypeId] &&
                                    userExerciseStatus[exercise.exerciseTypeId][exercise.exerciseId]) {
                                    _summary.status = userExerciseStatus[exercise.exerciseTypeId][exercise.exerciseId].status;

                                } else {
                                    _summary.status = ExerciseStatusEnum.NEW.enum;

                                }
                                _summary.correctAnswersNum = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].correctAnswersNum || 0;
                                _summary.wrongAnswersNum = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].wrongAnswersNum || 0;
                                _summary.skippedAnswersNum = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].skippedAnswersNum || 0;
                                _summary.duration = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].duration || 0;
                                _summary.totalAnswered = _summary.correctAnswersNum + _summary.wrongAnswersNum;
                            } else {
                                _summary.status = _summary.status ? _summary.status : ExerciseStatusEnum.NEW.enum;
                            }
                        }

                        if (exercise.exerciseTypeId === ExerciseTypeEnum.LECTURE.enum) {
                            exLectureCount ++;
                        }
                        if (_summary.status === ExerciseStatusEnum.COMPLETED.enum) {
                            exCompletedCount++;
                        }

                        if (!moduleSummary.overAll) {
                            moduleSummary.overAll = newOverAll();
                        }
                        var _overAll = moduleSummary.overAll;
                        if (exLectureCount === assignModule.exercises.length){
                            _overAll.status = ExerciseStatusEnum.NEW.enum;
                        } else if ((exLectureCount + exCompletedCount) === assignModule.exercises.length){
                            _overAll.status = ExerciseStatusEnum.COMPLETED.enum;
                        } else {
                            _overAll.status = _exerciseResults ? ExerciseStatusEnum.ACTIVE.enum : ExerciseStatusEnum.NEW.enum;
                        }
                        _overAll.totalCorrectAnswers += _summary.correctAnswersNum;
                        _overAll.totalWrongAnswers += _summary.wrongAnswersNum;
                        _overAll.totalSkippedAnswers += _summary.skippedAnswersNum;
                    });
                }

                return moduleSummary;
            }

            return userAssignModuleService;
        }
    ]);
})(angular);

angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
