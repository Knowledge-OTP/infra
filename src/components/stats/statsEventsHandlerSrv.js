(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsEventsHandlerSrv', [
        '$rootScope', 'exerciseEventsConst', 'StatsSrv', 'ExerciseTypeEnum', '$log', 'UtilitySrv',
        function ($rootScope, exerciseEventsConst, StatsSrv, ExerciseTypeEnum, $log, UtilitySrv) {
            var StatsEventsHandlerSrv = {};

            var childScope = $rootScope.$new(true);

            function _eventHandler(exerciseType, evt, exercise, results) {
                return StatsSrv.isExerciseStatsRecorded(exerciseType, exercise.id).then(function (isRecorded) {
                    if (isRecorded) {
                        return;
                    }

                    var newStats = {};

                    var questionsMap = UtilitySrv.array.convertToMap(exercise.questions);
                    results.questionResults.forEach(function (result) {
                        var question = questionsMap[result.questionId];
                        var categoryId = question.categoryId;

                        if (isNaN(+categoryId) || categoryId === null) {
                            $log.error('StatsEventsHandlerSrv: _eventHandler: bad category id for the following question: ', question.id, categoryId);
                            return;
                        }

                        if (!newStats[categoryId]) {
                            newStats[categoryId] = new StatsSrv.BaseStats();
                        }
                        var newStat = newStats[categoryId];

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
            }

            var eventsToRegister = [];
            var exerciseTypeEnumArr = ExerciseTypeEnum.getEnumArr();
            exerciseTypeEnumArr.forEach(function (enumObj) {
                var exerciseNameLowerCase = enumObj.val.toLowerCase();
                eventsToRegister.push({
                    evt: exerciseEventsConst[exerciseNameLowerCase].FINISH,
                    exerciseType: enumObj.enum
                });
            });

            eventsToRegister.forEach(function (evtConfig) {
                childScope.$on(evtConfig.evt, _eventHandler.bind(StatsEventsHandlerSrv, evtConfig.exerciseType));
            });
            //added in order to load the service
            StatsEventsHandlerSrv.init = angular.noop;

            return StatsEventsHandlerSrv;
        }
    ]);
})(angular);
