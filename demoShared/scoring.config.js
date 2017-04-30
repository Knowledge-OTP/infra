(function(angular){
    'use strict';

    angular.module('demo').config(function(ScoringServiceProvider){
        ScoringServiceProvider.setScoringLimits({
            exam: {
                min: 400,
                max: 1600
            },
            subjects: {
                min: 200,
                max: 800
            }
        });

        ScoringServiceProvider.setExamScoreFnGetter(function () {
            return function(scoresArr) {
                var totalScores = 0;
                angular.forEach(scoresArr, function (score) {
                    totalScores += score;
                });
                return totalScores;
            };
        });
    });
})(angular);
