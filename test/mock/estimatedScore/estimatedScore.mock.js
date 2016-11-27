(function (angular) {
    'use strict';

  var shouldEventBeProcessed;
    angular.module('estimatedScore.mock', [])
        .config(function (EstimatedScoreSrvProvider, EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst) {
            var subjectsRawScoreEdges = {
                0: {
                    min: 0,
                    max: 60
                },
                5: {
                    min: 0,
                    max: 85
                }
            };
            EstimatedScoreSrvProvider.setSubjectsRawScoreEdges(subjectsRawScoreEdges);

            EstimatedScoreSrvProvider.setRawScoreToRealScoreFn(function () {
                return function (subjectId, rawScore) {
                    return rawScore * 3;
                };
            });

            var MIN_DIAGNOSTIC_SCORE = 0;
            var MAX_DIAGNOSTIC_SCORE = 1500;
            EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(MIN_DIAGNOSTIC_SCORE, MAX_DIAGNOSTIC_SCORE);

            var diagnosticScoringMap = {
                1: [90, 90, 50, 50],
                2: [100, 100, 60, 60],
                3: [120, 120, 80, 80],
                4: [140, 140, 100, 100],
                5: [150, 150, 120, 120]
            };
            EstimatedScoreEventsHandlerSrvProvider.setDiagnosticScoring(diagnosticScoringMap);

            var sectionRawPoints = [1, 0, -0.25, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, sectionRawPoints);

            var drillRawPoints = [0.2, 0, 0, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.DRILL, drillRawPoints);

            EstimatedScoreEventsHandlerSrvProvider.setEventProcessControl(function () {
                return function () {
                    return angular.isDefined(shouldEventBeProcessed) ? shouldEventBeProcessed.apply(this, arguments) : true;
                };
            });

            EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(MIN_DIAGNOSTIC_SCORE, MAX_DIAGNOSTIC_SCORE);
        });
})(angular);
