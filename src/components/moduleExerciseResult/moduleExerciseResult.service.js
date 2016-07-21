(function (angular) {
    'use strict';

    angular.module('znk.infra.moduleExerciseResults').service('ModuleExerciseResultsService',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseResultSrv) {
            'ngInject';

            var moduleExerciseResultsService = {};

            moduleExerciseResultsService.getModuleExerciseResult = function (userId, moduleId, exerciseId, exerciseTypeId) {
                if(!UtilitySrv.fn.isValidNumber(exerciseTypeId) || !UtilitySrv.fn.isValidNumber(exerciseId)){
                    var errMSg = 'ExerciseResultSrv: exercise type id, exercise id should be number !!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                exerciseTypeId = +exerciseTypeId;
                exerciseId = +exerciseId;

                return ExerciseResultSrv.getExerciseResult(exerciseTypeId, exerciseId).then(function (exerciseResults) {

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


            return moduleExerciseResultsService;
        }
    );
})(angular);

