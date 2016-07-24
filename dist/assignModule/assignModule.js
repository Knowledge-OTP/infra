(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule', ['znk.infra.znkModule', 'znk.infra.exerciseResult']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', '$q', 'SubjectEnum', '$log', 'ExerciseResultSrv', 'ExerciseStatusEnum', 'ExerciseTypeEnum',
        function (ZnkModuleService, $q, SubjectEnum, $log, ExerciseResultSrv, ExerciseStatusEnum, ExerciseTypeEnum) {
            var userAssignModuleService = {};

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

                function getModuleSummary(assignModule){
                    return ZnkModuleService.getModuleById(assignModule.moduleId).then(function (moduleObj) {
                        var exerciseTypeId = ExerciseTypeEnum.PRACTICE.enum;
                        var exerciseId = moduleObj.exercises.filter(function (exercise) {
                            return exercise.typeId === exerciseTypeId ? exercise.id : null;
                        });

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
                    });
                }

                return userAssignModuleService.getUserAssignModules(userId).then(function (assignModules) {
                    return ZnkModuleService.getModuleHeaders().then(function(moduleHeaders){
                        var getProm = $q.when();
                        if(moduleHeaders) {
                            angular.forEach(assignModules, function (assignModule, assignModuleId) {
                                getProm = getProm.then(function () {
                                    assignModule.module = moduleHeaders[assignModuleId];
                                    return getModuleSummary(assignModule).then(function (moduleSummary) {
                                        assignModule.moduleSummary = moduleSummary;
                                    });
                                });
                            });
                        }
                        return getProm.then(function () {
                            return assignModules;
                        });
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
                                moduleResults[moduleId].subjectName = SubjectEnum.getEnumMap()[moduleHeaders[moduleId].subjectId];
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

            userAssignModuleService.setAssignContent = function (moduleId) {
                return ZnkModuleService.getModuleById(moduleId).then(function (module) {
                    module.contentAssign = true;
                    return ZnkModuleService.setModule(module);
                });
            };

            return userAssignModuleService;
        }
    ]);
})(angular);


angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
