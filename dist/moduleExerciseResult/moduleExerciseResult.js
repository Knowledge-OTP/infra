(function (angular) {
    'use strict';
    angular.module('znk.infra.moduleExerciseResult', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.moduleExerciseResult').service('ModuleExerciseResultService',
        ["InfraConfigSrv", "$log", "$q", "UtilitySrv", "ExerciseResultSrv", function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseResultSrv) {
            'ngInject';

            var moduleExerciseResultService = {};

            moduleExerciseResultService.getModuleExerciseResult = function (userId, moduleId, exerciseId, exerciseTypeId) {
                if(!UtilitySrv.fn.isValidNumber(exerciseTypeId) || !UtilitySrv.fn.isValidNumber(exerciseId)){
                    var errMSg = 'ExerciseResultSrv: exercise type id, exercise id should be number !!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                exerciseTypeId = +exerciseTypeId;
                exerciseId = +exerciseId;

                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    StudentStorageSrv.__config.variables.uid = userId;
                    return ExerciseResultSrv.getExerciseResult(exerciseTypeId, exerciseId).then(function (exerciseResults) {
                        return exerciseResults;
                    });
                });



               /* return _getExerciseResultsGuids(true, userId).then(function (exerciseResultsGuids) {
                    var resultGuid = exerciseResultsGuids[exerciseTypeId] && exerciseResultsGuids[exerciseTypeId][exerciseId];
                    if (!resultGuid) {
                        var newExerciseResultsGuild = UtilitySrv.general.createGuid();
                        return _getInitExerciseResult(exerciseTypeId, exerciseId, newExerciseResultsGuild).then(function (initResults) {
                            initResults.moduleId = moduleId;
                            initResults.$save = moduleExerciseSaveFn;
                            return initResults;
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function (exerciseResult) {
                        exerciseResult.$save = moduleExerciseSaveFn;
                        return exerciseResult;
                    });
                });*/
            };

            /*function moduleExerciseSaveFn(){
                /!* jshint validthis: true *!/
                return _calcExerciseResultFields(this).then(function (response) {
                    var exerciseResult = response.exerciseResult;
                    var dataToSave = response.dataToSave;
                    return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                        var exerciseTypeId = exerciseResult.exerciseTypeId;
                        var exerciseId = exerciseResult.exerciseId;

                        if (!exerciseResultsGuids[exerciseTypeId]) {
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        exerciseResultsGuids[exerciseTypeId][exerciseId] = exerciseResult.guid;
                        dataToSave[USER_EXERCISE_RESULTS_PATH] = exerciseResultsGuids;

                        return ModuleResultsService.getModuleResultByModuleId(exerciseResult.moduleId, exerciseResult.uid).then(function (moduleResult) {
                            if(!moduleResult.exerciseResults) {
                                moduleResult.exerciseResults = {};
                            }
                            if(!moduleResult.exerciseResults[exerciseTypeId]) {
                                moduleResult.exerciseResults[exerciseTypeId] = {};
                            }

                            moduleResult.exerciseResults[exerciseTypeId][exerciseId] = exerciseResult.guid;

                            return _getExercisesStatusData().then(function (exerciseStatuses) {
                                if(!moduleResult.exercisesStatus) {
                                    moduleResult.exercisesStatus = {};
                                }

                                if(!moduleResult.exercisesStatus[exerciseTypeId]) {
                                    moduleResult.exercisesStatus[exerciseTypeId] = {};
                                }

                                moduleResult.exercisesStatus[exerciseTypeId][exerciseId] = exerciseStatuses[exerciseTypeId][exerciseId].status;

                                var modulePath = ModuleResultsService.getModuleResultPath(moduleResult.guid);
                                dataToSave[modulePath] = moduleResult;

                                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                                    StudentStorageSrv.update(dataToSave);
                                    return exerciseResult;
                                });
                            });
                        });
                    });
                });
            }*/

            return moduleExerciseResultService;
        }]
    );
})(angular);


angular.module('znk.infra.moduleExerciseResult').run(['$templateCache', function($templateCache) {

}]);
