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

            userAssignModuleService.assignType = {
                module: {
                    id: 1,
                    fbPath: 'moduleResults'
                },
                homework: {
                    id: 2,
                    fbPath: 'assignHomework/homework'
              }
            };

            userAssignModuleService.offExternalOnValue = function (userId, valueCB, changeCB) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    var assignContentPath = _getAssignContentPath(valueCB.type);
                    studentStorage.offEvent('value', 'users/' + userId + '/' + assignContentPath, onValueEventCB);
                    angular.forEach(registerEvents[userId], function (cbArr, contentType) {
                        angular.forEach(registerEvents[userId][contentType].valueCB, function (cb, index) {
                            if (cb === valueCB) {
                                registerEvents[userId][contentType].valueCB.splice(index, 1);
                            }
                        });
                    });

                    angular.forEach(registerEvents[userId], function (cbArr, contentType) {
                        if (registerEvents[userId][contentType].changeCB) {
                            angular.forEach(registerEvents[userId][contentType].changeCB, function (cbData, index) {
                                if (cbData.cb === changeCB) {
                                    angular.forEach(cbData.guids, function (resultGuid) {
                                        var assignContentPath = _getAssignContentPath(changeCB.type);
                                        studentStorage.offEvent('child_changed', assignContentPath + '/'+ resultGuid, onModuleResultChangedCB);
                                    });
                                    registerEvents[userId][contentType].changeCB.splice(index, 1);
                                }
                            });
                        }
                    });
                });
            };

            userAssignModuleService.registerExternalOnValueCB = function (userId, contentType, valueCB, changeCB) {
                valueCB.type = contentType;
                changeCB.type = contentType;
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    if (!registerEvents[userId]) {
                        registerEvents[userId] = {};
                    }

                    if(!registerEvents[userId][contentType]){
                        registerEvents[userId][contentType] = {};
                    }

                    if (!registerEvents[userId][contentType].valueCB) {
                        registerEvents[userId][contentType].valueCB = [];
                    }
                    registerEvents[userId][contentType].valueCB.push(valueCB);

                    if (!registerEvents[userId][contentType].changeCB) {
                        registerEvents[userId][contentType].changeCB = [];
                    }
                    registerEvents[userId][contentType].changeCB.push({
                        cb: changeCB,
                        guids: []
                    });

                    var assignContentPath = _getAssignContentPath(contentType);
                    studentStorage.onEvent('value', 'users/' + userId + '/' + assignContentPath, onValueEventCB);
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

            function _getAssignContentPath(contentType) {
                switch (contentType) {
                    case 1:
                        return 'moduleResults';
                    case 2:
                        return 'assignHomework/homework';
                }
            }

            function _getContentTypeByPath(path) {
                switch (path) {
                    case 'moduleResults':
                        return 1;
                    case 'homework':
                        return 2;
                }
            }

            function onValueEventCB(moduleResultsGuids, path) {
                var contentType = _getContentTypeByPath(path);
                if (angular.isUndefined(moduleResultsGuids) || !moduleResultsGuids) {
                    var userId = StudentContextSrv.getCurrUid();
                    userAssignModuleService.assignModules = {};
                    applyCB(registerEvents[userId][contentType].valueCB, contentType);
                    return;
                }
                buildResultsFromGuids(moduleResultsGuids, contentType);
            }

            function buildResultsFromGuids(moduleResultsGuids, contentType) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    var moduleResults = {};
                    var getPromArr = [];
                    var userId = StudentContextSrv.getCurrUid();

                    angular.forEach(moduleResultsGuids, function (resultGuid, moduleId) {
                        var getProm = getResultsByModuleId(userId, moduleId, contentType).then(function (moduleResult) {
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
                        applyCB(registerEvents[userId][contentType].valueCB, contentType);
                    });
                });
            }

            function getResultsByModuleId(userId, moduleId, contentType) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId, false, true, contentType).then(function (moduleResult) {
                    if (moduleResult && !angular.equals(moduleResult, {})) {
                        moduleResult.moduleSummary = getModuleSummary(moduleResult);

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
            }

            function onModuleResultChangedCB() {
                var userId = StudentContextSrv.getCurrUid();
                ExerciseResultSrv.getUserModuleResultsGuids(userId).then(function (moduleResultsGuids) {
                    buildResultsFromGuids(moduleResultsGuids);
                });
            }

            function applyCB(cbArr, contentType) {
                angular.forEach(cbArr, function (valueCB) {
                    if (angular.isFunction(valueCB)) {
                        if(valueCB.type === contentType){
                            valueCB(userAssignModuleService.assignModules);
                        }
                    }
                });
            }

            function getModuleSummary(assignModule) {
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
                        var exerciseTypeId, exerciseId;

                        if (angular.isDefined(exercise.examId)) {
                            exerciseTypeId = ExerciseTypeEnum.SECTION.enum;
                            exerciseId = exercise.id;
                        } else {
                            exerciseTypeId = exercise.exerciseTypeId;
                            exerciseId = exercise.exerciseId;
                        }

                        if (!moduleSummary[exerciseTypeId]){
                            moduleSummary[exerciseTypeId] = {};
                        }
                        var currentExerciseRes;
                        if (!moduleSummary[exerciseTypeId][exerciseId]){
                            currentExerciseRes = newSummary();
                        }

                        if (_exerciseResults && _exerciseResults[exerciseTypeId]) {
                            if (_exerciseResults[exerciseTypeId][exerciseId]){

                                currentExerciseRes.status = _exerciseResults[exerciseTypeId][exerciseId].isComplete ?
                                    ExerciseStatusEnum.COMPLETED.enum : ExerciseStatusEnum.ACTIVE.enum;

                                currentExerciseRes.correctAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].correctAnswersNum || 0;
                                currentExerciseRes.wrongAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].wrongAnswersNum || 0;
                                currentExerciseRes.skippedAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].skippedAnswersNum || 0;
                                currentExerciseRes.duration = _exerciseResults[exerciseTypeId][exerciseId].duration || 0;
                                currentExerciseRes.totalAnswered = currentExerciseRes.correctAnswersNum + currentExerciseRes.wrongAnswersNum;
                            }
                        }

                        if (exerciseTypeId === ExerciseTypeEnum.LECTURE.enum) {
                            exLectureCount ++;
                        }
                        if (currentExerciseRes.status === ExerciseStatusEnum.COMPLETED.enum) {
                            exCompletedCount++;
                        }


                        if (!moduleSummary.overAll) {
                            moduleSummary.overAll = newOverAll();
                        }

                        var _overAll = moduleSummary.overAll;
                        /*
                        if (exLectureCount === assignModule.exercises.length){
                            _overAll.status = ExerciseStatusEnum.NEW.enum;
                        } else if ((exLectureCount + exCompletedCount) === assignModule.exercises.length){
                            _overAll.status = ExerciseStatusEnum.COMPLETED.enum;
                        } else {
                            if (exCompletedCount === 0 && (currentExerciseRes.status == ExerciseStatusEnum.ACTIVE.enum)) {
                                _overAll.status = ExerciseStatusEnum.ACTIVE.enum;
                            } else {
                                _overAll.status = ExerciseStatusEnum.ACTIVE.enum;
                            }

                            //_overAll.status = _exerciseResults ? ExerciseStatusEnum.ACTIVE.enum : ExerciseStatusEnum.COMPLETED.enum;
                        }
                        */

                        _overAll.totalCorrectAnswers += currentExerciseRes.correctAnswersNum;
                        _overAll.totalWrongAnswers += currentExerciseRes.wrongAnswersNum;
                        _overAll.totalSkippedAnswers += currentExerciseRes.skippedAnswersNum;

                        moduleSummary[exerciseTypeId][exerciseId] = currentExerciseRes;
                    });

                    if (assignModule.exerciseResults.length) {

                        moduleSummary.overAll.status = ExerciseStatusEnum.COMPLETED.enum;

                        angular.forEach(assignModule.exerciseResults, function (exerciseResults) {
                            if (!exerciseResults.isComplete && exerciseResults.exerciseTypeId !== ExerciseTypeEnum.LECTURE.enum) {
                                moduleSummary.overAll.status = ExerciseStatusEnum.ACTIVE.enum;
                            }
                        });
                    }


                }

                return moduleSummary;
            }

            return userAssignModuleService;
        }
    ]);
})(angular);

angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
