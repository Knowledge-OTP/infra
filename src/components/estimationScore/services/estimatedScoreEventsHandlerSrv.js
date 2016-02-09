(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreEventsHandlerSrv', function EstimatedScoreEventsHandler() {
        function pointsMap(correctWithinAllowedTimeFrame, correctAfterAllowedTimeFrame, wrongWithinAllowedTimeFrame, wrongAfterAllowedTimeFrame) {
            var ret = {};

            if (angular.isDefined(correctWithinAllowedTimeFrame)) {
                ret.correctWithin = correctWithinAllowedTimeFrame;
            }

            if (angular.isDefined(correctAfterAllowedTimeFrame)) {
                ret.correctAfter = correctAfterAllowedTimeFrame;
            }

            if (angular.isDefined(wrongWithinAllowedTimeFrame)) {
                ret.wrongWithin = wrongWithinAllowedTimeFrame;
            }

            if (angular.isDefined(wrongAfterAllowedTimeFrame)) {
                ret.wrongAfter = wrongAfterAllowedTimeFrame;
            }

            ret.unanswered = 0;

            return ret;
        }

        var diagnosticScoring = {};
        this.setDiagnosticScoring = function (diagnosticScoringData) {
            var keys = Object.keys(diagnosticScoringData);
            keys.forEach(function(questionDifficulty){
                var scoringDataArr = diagnosticScoringData[questionDifficulty];
                diagnosticScoring[questionDifficulty] = pointsMap.apply(this,scoringDataArr);
            });
        };

        var exercisesRawScoring = {};
        this.setExerciseRawPoints = function(exerciseType,scoringData){
            exercisesRawScoring[exerciseType] = pointsMap.apply(this,scoringData);
        };

        var allowedTimeForExercisesMap;
        this.setAllowedTimeForExercises = function(_allowedTimeForExercisesMap){
            allowedTimeForExercisesMap = _allowedTimeForExercisesMap;
        };

        this.$get = [
            '$rootScope', 'ExamTypeEnum', 'EstimatedScoreSrv', 'SubjectEnum','ExerciseTypeEnum', 'ExerciseAnswerStatusEnum', 'exerciseEventsConst', '$log',
            function ($rootScope, ExamTypeEnum, EstimatedScoreSrv, SubjectEnum,ExerciseTypeEnum, ExerciseAnswerStatusEnum, exerciseEventsConst, $log) {
                if(angular.equals({},diagnosticScoring)){
                    $log.debug('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if(angular.equals({},exercisesRawScoring)){
                    $log.debug('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if(!allowedTimeForExercisesMap){
                    $log.debug('EstimatedScoreEventsHandlerSrv: allowedTimeForExercisesMap was not set !!!');
                }

                var EstimatedScoreEventsHandlerSrv = {};

                var childScope = $rootScope.$new(true);

                function _basePointsGetter(pointsMap, answerStatus, withinAllowTime) {
                    var key;
                    if (answerStatus === ExerciseAnswerStatusEnum.unanswered.enum) {
                        key = 'unanswered';
                    } else {
                        key = answerStatus === ExerciseAnswerStatusEnum.correct.enum ? 'correct' : 'wrong';
                        key += withinAllowTime ? 'Within' : 'After';
                    }
                    return pointsMap[key];
                }

                function _getDiagnosticQuestionPoints(question, result) {
                    var pointsMap = diagnosticScoring[question.difficulty];
                    var answerStatus = result.isAnsweredCorrectly ? ExerciseAnswerStatusEnum.correct.enum : ExerciseAnswerStatusEnum.wrong.enum;
                    return _basePointsGetter(pointsMap, answerStatus, true);
                }

                function diagnosticSectionCompleteHandler(section, sectionResult) {
                    var score = 0;

                    var questions = section.questions;
                    for (var i in sectionResult.questionResults) {
                        var question = questions[i];
                        var result = sectionResult.questionResults[i];
                        score += _getDiagnosticQuestionPoints(question, result);
                    }
                    EstimatedScoreSrv.setDiagnosticSectionScore(score, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id);
                }

                function _getQuestionRawPoints(exerciseType, result) {
                    var isAnsweredWithinAllowedTime;
                    var answerStatus;

                    //answered after allowed time
                    if (angular.isDefined(result.answerAfterTime)) {
                        isAnsweredWithinAllowedTime = false;
                        answerStatus = result.answerAfterTime;
                    } else {//answered within allowed time
                        isAnsweredWithinAllowedTime = true;
                        answerStatus = ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum(result.isAnsweredCorrectly);
                    }

                    var rawPointsMap = exercisesRawScoring[exerciseType];
                    return _basePointsGetter(rawPointsMap, answerStatus, isAnsweredWithinAllowedTime);
                }

                function calculateRawScore(exerciseType, exerciseResult, allowedTime) {
                    if(!exercisesRawScoring[exerciseType]){
                        $log.error('EstimatedScoreEventsHandlerSrv: raw scoring not exits for the following exercise type: '+ exerciseType);
                    }

                    var questionResults = exerciseResult.questionResults;

                    var rawPoints = {
                        total: questionResults.length * exercisesRawScoring[exerciseType].correctWithin,
                        earned: 0
                    };

                    var allowedTimeForExercise = angular.isDefined(allowedTime) ? allowedTime : allowedTimeForExercisesMap[exerciseType];
                    if(angular.isUndefined(allowedTimeForExercise)){
                        $log.error('EstimatedScoreEventsHandlerSrv: allowed time missing for the following exercise type: ' + exerciseType);
                    }
                    var withinAllowedTime = allowedTimeForExercise >= exerciseResult.duration;
                    questionResults.forEach(function (result) {
                        rawPoints.earned += _getQuestionRawPoints(exerciseType, result, withinAllowedTime);
                    });
                    return rawPoints;
                }

                childScope.$on(exerciseEventsConst.section.FINISH, function (evt, section, sectionResult, exam) {
                    var isDiagnostic = exam.typeId === ExamTypeEnum.DIAGNOSTIC.enum;
                    if (isDiagnostic) {
                        diagnosticSectionCompleteHandler(section, sectionResult);
                    }
                    var rawScore = calculateRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult, section.time);
                    EstimatedScoreSrv.addRawScore(rawScore, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id, isDiagnostic);
                });

                function _baseExerciseFinishHandler(exerciseType, evt, exercise, exerciseResult) {
                    var rawScore = calculateRawScore(exerciseType, exerciseResult);
                    EstimatedScoreSrv.addRawScore(rawScore, exerciseType, exercise.subjectId, exercise.id);
                }

                var exercisesHandledByBaseExerciseFinishHandler = [
                    {
                        name: exerciseEventsConst.drill.FINISH,
                        type: ExerciseTypeEnum.DRILL.enum
                    },
                    {
                        name: exerciseEventsConst.tutorial.FINISH,
                        type: ExerciseTypeEnum.TUTORIAL.enum
                    },
                    {
                        name: exerciseEventsConst.game.FINISH,
                        type: ExerciseTypeEnum.GAME.enum
                    }
                ];
                exercisesHandledByBaseExerciseFinishHandler.forEach(function (evt) {
                    $rootScope.$on(evt.name, _baseExerciseFinishHandler.bind(EstimatedScoreEventsHandlerSrv, evt.type));
                });

                EstimatedScoreEventsHandlerSrv.init = angular.noop;

                return EstimatedScoreEventsHandlerSrv;
            }
        ];

    });
})(angular);
