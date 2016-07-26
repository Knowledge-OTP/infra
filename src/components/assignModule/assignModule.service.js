(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', '$q', 'SubjectEnum', '$log', 'ExerciseResultSrv', 'ExerciseStatusEnum', 'ExerciseTypeEnum', 'EnumSrv',
        function (ZnkModuleService, $q, SubjectEnum, $log, ExerciseResultSrv, ExerciseStatusEnum, ExerciseTypeEnum, EnumSrv) {
            var userAssignModuleService = {};

            userAssignModuleService.assignModuleStatus = new EnumSrv.BaseEnum([
                ['ASSIGNED', ExerciseStatusEnum.NEW.val, 'assigned'],
                ['IN-PROGRESS', ExerciseStatusEnum.ACTIVE.val, 'in progress'],
                ['COMPLETED', ExerciseStatusEnum.COMPLETED.val, 'completed']
            ]);

            userAssignModuleService.getUserAssignModules = function (userId) {
                return ExerciseResultSrv.getUserModuleResultsGuids(userId).then(function (resultsGuids) {
                    var moduleResults = {};
                    var getProm = $q.when();
                    angular.forEach(resultsGuids, function (resultGuid, resultModuleId) {
                        getProm = getProm.then(function() {
                            return ExerciseResultSrv.getModuleResult(userId, resultModuleId, false).then(function(moduleResult){
                                if(moduleResult) {
                                    moduleResults[moduleResult.moduleId] = moduleResult;
                                }
                            });
                        });
                    });

                    return getProm.then(function () {
                        return moduleResults;
                    });
                });
            };

            userAssignModuleService.getUserAssignModulesWithProgress = function (userId) {

                function getModuleSummary(assignModule, moduleHeaders){
                    var exerciseId;
                    var exerciseTypeId = ExerciseTypeEnum.PRACTICE.enum;
                    var practiceExercise = moduleHeaders[assignModule.moduleId].exercises.filter(function (exercise) {
                        return exercise.exerciseTypeId === exerciseTypeId ? exercise.exerciseId : null;
                    });

                    if (practiceExercise) {
                        exerciseId = practiceExercise.exerciseId;
                    }

                    var status = ExerciseStatusEnum.NEW.enum;
                    var correctAnswersNum = 0,
                        wrongAnswersNum = 0,
                        skippedAnswersNum = 0,
                        totalAnswered = 0,
                        duration = 0;

                    if(assignModule.exercisesStatus) {
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
                            totalAnswered = correctAnswersNum + wrongAnswersNum + skippedAnswersNum;
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

                    /* return ZnkModuleService.getModuleById(assignModule.moduleId).then(function (moduleObj) {

                     });*/
                }

                return ZnkModuleService.getModuleHeaders().then(function (headers) {
                    var moduleHeaders = headers;
                    return userAssignModuleService.getUserAssignModules(userId).then(function (assignModules) {
                        angular.forEach(assignModules, function (assignModule) {
                            assignModule.moduleSummary = getModuleSummary(assignModule, moduleHeaders);
                        });
                        return assignModules;
                    });
                });
            };

            userAssignModuleService.setUserAssignModules = function (moduleIds, userId, tutorId) {
                if(!angular.isArray(moduleIds)){
                    var errMSg = 'UserAssignModuleService: 1st argument should be array of module ids';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                var moduleResults = {};
                var getProm = $q.when();
                angular.forEach(moduleIds, function (moduleId) {
                    getProm = getProm.then(function(){
                        return ExerciseResultSrv.getModuleResult(userId, moduleId, false).then(function (moduleResult) {
                            moduleResults[moduleId] = moduleResult;
                            return moduleResults;
                        });
                    });

                });
                return getProm.then(function () {
                    return ZnkModuleService.getModuleHeaders().then(function (moduleHeaders) {
                        var saveProm = $q.when();
                        angular.forEach(moduleIds, function (moduleId) {
                            if(!moduleResults[moduleId]) {
                                moduleResults[moduleId] =  ExerciseResultSrv.getDefaultModuleResult(moduleId, userId);
                                moduleResults[moduleId].assignedTutorId = tutorId;
                                // copy fields from module object to results object for future using
                                moduleResults[moduleId].name = moduleHeaders[moduleId].name;
                                moduleResults[moduleId].desc = moduleHeaders[moduleId].desc;
                                moduleResults[moduleId].subjectId = moduleHeaders[moduleId].subjectId;
                                moduleResults[moduleId].order = moduleHeaders[moduleId].order;
                                moduleResults[moduleId].exercises = moduleHeaders[moduleId].exercises;
                                moduleResults[moduleId].assignDate = Date.now();
                            }
                            moduleResults[moduleId].assign = true;

                            saveProm = saveProm.then(function(){
                                return ExerciseResultSrv.setModuleResult(moduleResults[moduleId]);
                            });
                        });

                        return saveProm.then(function () {
                            return moduleResults;
                        });
                    });
                });
            };

            userAssignModuleService.setAssignContent = function (userId, moduleId) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId).then(function (moduleResult) {
                    moduleResult.contentAssign = true;
                    return ExerciseResultSrv.setModuleResult(moduleResult);
                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);

