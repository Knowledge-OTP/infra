(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsEventsHandlerSrv', [
        '$rootScope','exerciseEventsConst', 'StatsSrv', 'ExerciseTypeEnum', '$log', 'SubjectEnum', 'QuestionFormatEnum',
        function ($rootScope, exerciseEventsConst, StatsSrv, ExerciseTypeEnum, $log, SubjectEnum, QuestionFormatEnum) {
            var StatsEventsHandlerSrv = {};

            var childScope = $rootScope.$new(true);

            function _eventHandler(exerciseType, evt, exercise, results){
                return StatsSrv.isExerciseStatsRecorded().then(function(isRecorded){
                    if(isRecorded){
                        return;
                    }

                    var newStats  = {};

                    results.questionResults.forEach(function(result,index){
                        var question = exercise.questions[index];
                        var categoryId = question.categoryId;

                        //if writing question then only standard format should be recorded
                        if(question.subjectId === SubjectEnum.WRITING.enum && question.questionFormatId !== QuestionFormatEnum.STANDARD.enum){
                            return;
                        }

                        if(isNaN(+categoryId) || categoryId === null){
                            $log.error('StatsEventsHandlerSrv: _eventHandler: bad category id for the following question: ',question.id,categoryId);
                            return;
                        }

                        if(!newStats[categoryId]){
                            newStats[categoryId] = new StatsSrv.BaseStats();
                        }
                        var newStat = newStats[categoryId];

                        newStat.totalQuestions++;

                        newStat.totalTime += result.timeSpent || 0;

                        if(angular.isUndefined(result.userAnswer)){
                            newStat.unanswered++;
                        }else if(result.isAnsweredCorrectly){
                            newStat.correct++;
                        }else{
                            newStat.wrong++;
                        }
                    });

                    return StatsSrv.updateStats(newStats, exerciseType, exercise.id);
                });
            }

            var eventsToRegister = [];
            var exerciseTypeEnumArr = ExerciseTypeEnum.getEnumArr();
            exerciseTypeEnumArr.forEach(function(enumObj){
                var exerciseNameLowerCase = enumObj.val.toLowerCase();
                eventsToRegister.push({
                    evt: exerciseEventsConst[exerciseNameLowerCase].FINISH,
                    exerciseType: enumObj.enum
                });
            });

            eventsToRegister.forEach(function(evtConfig){
                childScope.$on(evtConfig.evt,_eventHandler.bind(StatsEventsHandlerSrv,evtConfig.exerciseType));
            });
            //added in order to load the service
            StatsEventsHandlerSrv.init = angular.noop;

            return StatsEventsHandlerSrv;
        }
    ]);
})(angular);
