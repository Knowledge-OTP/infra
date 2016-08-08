(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule', ['znk.infra.znkModule', 'znk.infra.exerciseResult']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', '$q', 'SubjectEnum', 'ExerciseResultSrv', 'ExerciseStatusEnum', 'ExerciseTypeEnum', 'EnumSrv', '$log', 'InfraConfigSrv', 'UserProfileService',
        function (ZnkModuleService, $q, SubjectEnum, ExerciseResultSrv, ExerciseStatusEnum, ExerciseTypeEnum, EnumSrv, $log, InfraConfigSrv, UserProfileService) {
            var userAssignModuleService = {};
            userAssignModuleService.assignModules = {};

            userAssignModuleService.assignModuleStatus = new EnumSrv.BaseEnum([
                ['ASSIGNED', ExerciseStatusEnum.NEW.enum, 'assigned'],
                ['IN-PROGRESS', ExerciseStatusEnum.ACTIVE.enum, 'in progress'],
                ['COMPLETED', ExerciseStatusEnum.COMPLETED.enum, 'completed']
            ]);

            userAssignModuleService.registerExternalOnValueCB = function (cb) {
                UserProfileService.getCurrUserId().then(function (userId) {
                    if (!angular.isDefined(userId)) {
                        return $q.when();
                    }
                    InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                        studentStorage.onEvent('value', 'users/' + userId + '/moduleResults', onValueEventCB.bind(null, userId, cb, studentStorage));
                    });
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
                        return ExerciseResultSrv.getModuleResult(userId, moduleId, false).then(function (moduleResult) {
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

            function getModuleSummary(assignModule) {
                var exerciseId;
                var exerciseTypeId = ExerciseTypeEnum.PRACTICE.enum,
                    status = ExerciseStatusEnum.NEW.enum,
                    correctAnswersNum = 0,
                    wrongAnswersNum = 0,
                    skippedAnswersNum = 0,
                    totalAnswered = 0,
                    duration = 0;

                if (assignModule.exercises) {
                    var practiceExercise = assignModule.exercises.filter(function (exercise) {
                        return exercise.exerciseTypeId === exerciseTypeId ? exercise.exerciseId : null;
                    });

                    if (practiceExercise && practiceExercise.length) {
                        exerciseId = practiceExercise[0].exerciseId;

                        if (assignModule.exercisesStatus) {
                            if (assignModule.exercisesStatus[exerciseTypeId] && assignModule.exercisesStatus[exerciseTypeId][exerciseId]) {
                                status = assignModule.exercisesStatus[exerciseTypeId][exerciseId];
                            }
                        }

                        if (assignModule.exerciseResults) {
                            if (assignModule.exerciseResults[exerciseTypeId] && assignModule.exerciseResults[exerciseTypeId][exerciseId]) {
                                correctAnswersNum = assignModule.exerciseResults[exerciseTypeId][exerciseId].correctAnswersNum || 0;
                                wrongAnswersNum = assignModule.exerciseResults[exerciseTypeId][exerciseId].wrongAnswersNum || 0;
                                skippedAnswersNum = assignModule.exerciseResults[exerciseTypeId][exerciseId].skippedAnswersNum || 0;
                                duration = assignModule.exerciseResults[exerciseTypeId][exerciseId].duration || 0;
                                totalAnswered = correctAnswersNum + wrongAnswersNum;
                            }
                        }
                    }
                }

                return {
                    status: status,
                    correctAnswersNum: correctAnswersNum,
                    wrongAnswersNum: wrongAnswersNum,
                    skippedAnswersNum: skippedAnswersNum,
                    duration: duration,
                    totalAnswered: totalAnswered
                };
            }

            function onValueEventCB(userId, cb, studentStorage, moduleResultsGuids) {
                if (angular.isUndefined(moduleResultsGuids)) {
                    return;
                }
                var moduleResults = {};
                var getProm = $q.when();
                var getPromArr = [];
                angular.forEach(moduleResultsGuids, function (resultGuid, moduleId) {
                    getProm = ExerciseResultSrv.getModuleResult(userId, moduleId, false).then(function (moduleResult) {
                        if (moduleResult && !angular.equals(moduleResult, {})) {
                            moduleResults[moduleResult.moduleId] = moduleResult;
                        }
                    });
                    getPromArr.push(getProm);
                });

                $q.all(getPromArr).then(function () {
                    angular.forEach(moduleResults, function (assignModule) {
                        assignModule.moduleSummary = getModuleSummary(assignModule);

                        if (!assignModule.contentAssign) {
                            var modulePath = 'moduleResults/' + assignModule.guid + '/contentAssign';
                            studentStorage.onEvent('value', modulePath, onContentAssignCB.bind(null, assignModule, studentStorage, cb));
                        }
                    });

                    userAssignModuleService.assignModules = moduleResults;
                    applyCB(cb);
                });
            }

            function onContentAssignCB(assignModule, studentStorage, cb, contentAssign) {
                if (contentAssign) {
                    var modulePath = 'moduleResults/' + assignModule.guid + '/contentAssign';
                    studentStorage.offEvent('value', modulePath, onContentAssignCB);

                    userAssignModuleService.assignModules[assignModule.moduleId].contentAssign = contentAssign;
                    applyCB(cb);
                }
            }

            function applyCB(cb) {
                if (angular.isFunction(cb)) {
                    cb(userAssignModuleService.assignModules);
                }
            }

            return userAssignModuleService;
        }
    ]);
})(angular);


angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
