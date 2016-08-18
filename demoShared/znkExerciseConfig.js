(function (angular) {
    'use strict';

    angular.module('demo').config(function(exerciseTypeConst, ZnkExerciseSrvProvider) {
        var allowedTimeForQuestionByExercise = {};
        allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
        allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
        allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
        ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);
    });
})(angular);
