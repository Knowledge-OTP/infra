(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring').controller('ETutoringWorkoutController',
        function (exerciseData) {
            'ngInject';
            this.completeExerciseDetails = {
                exerciseId: exerciseData.exerciseId,
                exerciseTypeId: exerciseData.exerciseTypeId,
                exerciseParentId: exerciseData.exerciseParentId,
                exerciseParentTypeId: exerciseData.exerciseParentTypeId,
                moduleResultGuid: exerciseData.moduleResultGuid,
                assignContentType: exerciseData.assignContentType,
                examId: exerciseData.examId
            };

            this.completeExerciseSettings = {
                exitAction: exerciseData.exitAction
            };
        });
})(angular);
