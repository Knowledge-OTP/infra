(function (angular) {
    'use strict';

    angular.module('demo').config(function (EstimatedScoreSrvProvider, SubjectEnumConst, EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst) {
        'ngInject';

        var subjectsRawScoreEdges = {
            [SubjectEnumConst.VERBAL]: {
                min: 0,
                max: 80
            },
            [SubjectEnumConst.MATH]: {
                min: 0,
                max: 58
            }
        };
        EstimatedScoreSrvProvider.setSubjectsRawScoreEdges(subjectsRawScoreEdges);

        EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(-Infinity, Infinity);

        function rawScoreToScoreFnGetter(ScoringService) {
            'ngInject';

            return function (subjectId, rawScore) {
                return ScoringService.rawScoreToScore(subjectId, rawScore);
            };
        }

        EstimatedScoreSrvProvider.setRawScoreToRealScoreFn(rawScoreToScoreFnGetter);

        var diagnosticScoringMap = {
            1: [55, 55, 45, 45],
            2: [65, 65, 50, 50],
            3: [75, 75, 55, 55],
            4: [85, 85, 65, 65],
            5: [95, 95, 75, 75]
        };
        EstimatedScoreEventsHandlerSrvProvider.setDiagnosticScoring(diagnosticScoringMap);

        var defaultRawPointsForExercise = [1, 0, 0, 0];
        EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, defaultRawPointsForExercise);
        EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.TUTORIAL, defaultRawPointsForExercise);
        EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.PRACTICE, defaultRawPointsForExercise);

        function eventProcessControl(SubjectEnum) {
            'ngInject';

            return function (exerciseType, exercise) {
                return exercise.subjectId !== SubjectEnum.ESSAY.enum;
            };
        }
        EstimatedScoreEventsHandlerSrvProvider.setEventProcessControl(eventProcessControl);
    });
})(angular);

