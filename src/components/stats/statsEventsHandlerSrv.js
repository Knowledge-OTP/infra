(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsEventsHandlerSrv', [
        'exerciseEventsConst', 'StatsSrv', 'ExerciseTypeEnum', '$log', 'UtilitySrv',
        function (exerciseEventsConst, StatsSrv, ExerciseTypeEnum, $log, UtilitySrv) {
            var StatsEventsHandlerSrv = {};

            StatsEventsHandlerSrv.addNewExerciseResult = function (exerciseType, exercise, results) {
                return StatsSrv.isExerciseStatsRecorded(exerciseType, exercise.id).then(function (isRecorded) {
                    if (isRecorded) {
                        return;
                    }

                    var newStats = {};

                    var questionsMap = UtilitySrv.array.convertToMap(exercise.questions);
                    results.questionResults.forEach(function (result) {
                        var question = questionsMap[result.questionId];
                        var categoryIds = {};
                        categoryIds.categoryId = question.categoryId;
                        categoryIds.categoryId2 = question.categoryId2;
                        var categoryId = question.categoryId;
                        categoryIds.forEach(function (categoryId) {

                            if (isNaN(+categoryId) || categoryId === null) {
                                $log.error('StatsEventsHandlerSrv: _eventHandler: bad category id for the following question: ', question.id, categoryId);
                                return;
                            }

                            if (!newStats[categoryId]) {
                                newStats[categoryId] = new StatsSrv.BaseStats();
                            }
                            var newStat = newStats[categoryId];

                        })
                        newStat.totalQuestions++;

                        newStat.totalTime += result.timeSpent || 0;

                        if (angular.isUndefined(result.userAnswer)) {
                            newStat.unanswered++;
                        } else if (result.isAnsweredCorrectly) {
                            newStat.correct++;
                        } else {
                            newStat.wrong++;
                        }
                    });

                    return StatsSrv.updateStats(newStats, exerciseType, exercise.id);
                });
            };

            //added in order to load the service
            StatsEventsHandlerSrv.init = angular.noop;

            return StatsEventsHandlerSrv;
        }
    ]);
})(angular);
