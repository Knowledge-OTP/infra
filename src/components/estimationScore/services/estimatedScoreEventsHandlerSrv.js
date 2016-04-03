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
            keys.forEach(function (questionDifficulty) {
                var scoringDataArr = diagnosticScoringData[questionDifficulty];
                diagnosticScoring[questionDifficulty] = pointsMap.apply(this, scoringDataArr);
            });
        };

        var exercisesRawScoring = {};
        this.setExerciseRawPoints = function (exerciseType, scoringData) {
            exercisesRawScoring[exerciseType] = pointsMap.apply(this, scoringData);
        };

        var eventProcessControl;
        this.setEventProcessControl = function(_eventProcessControl){
            eventProcessControl = _eventProcessControl;
        };

        this.$get = [
            '$rootScope', 'ExamTypeEnum', 'EstimatedScoreSrv', 'SubjectEnum', 'ExerciseTypeEnum', 'ExerciseAnswerStatusEnum', 'exerciseEventsConst', '$log', 'UtilitySrv', '$injector', '$q',
            function ($rootScope, ExamTypeEnum, EstimatedScoreSrv, SubjectEnum, ExerciseTypeEnum, ExerciseAnswerStatusEnum, exerciseEventsConst, $log, UtilitySrv, $injector, $q) {
                if (angular.equals({}, diagnosticScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if (angular.equals({}, exercisesRawScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
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

                function _diagnosticSectionCompleteHandler(section, sectionResult) {
                    var score = 0;

                    var questions = section.questions;
                    var questionsMap = UtilitySrv.array.convertToMap(questions);

                    sectionResult.questionResults.forEach(function (result, i) {
                        var question = questionsMap[result.questionId];
                        if (angular.isUndefined(question)) {
                            $log.error('EstimatedScoreEventsHandler: question for result is missing',
                                'section id: ', section.id,
                                'result index: ', i
                            );
                        } else {
                            score += _getDiagnosticQuestionPoints(question, result);
                        }
                    });
                    EstimatedScoreSrv.setDiagnosticSectionScore(score, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id);
                }

                function _getQuestionRawPoints(exerciseType, result) {
                    var isAnsweredWithinAllowedTime = !result.afterAllowedTime;

                    var answerStatus = ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum(result.isAnsweredCorrectly);

                    var rawPointsMap = exercisesRawScoring[exerciseType];
                    return _basePointsGetter(rawPointsMap, answerStatus, isAnsweredWithinAllowedTime);
                }

                function _calculateRawScore(exerciseType, exerciseResult) {
                    if (!exercisesRawScoring[exerciseType]) {
                        $log.error('EstimatedScoreEventsHandlerSrv: raw scoring not exits for the following exercise type: ' + exerciseType);
                    }

                    var questionResults = exerciseResult.questionResults;

                    var rawPoints = {
                        total: questionResults.length * exercisesRawScoring[exerciseType].correctWithin,
                        earned: 0
                    };

                    questionResults.forEach(function (result) {
                        rawPoints.earned += _getQuestionRawPoints(exerciseType, result);
                    });
                    return rawPoints;
                }

                function _shouldEventBeProcessed(exerciseType, exercise, exerciseResult){
                    if(!eventProcessControl){
                        return $q.when(true);
                    }

                    var shouldEventBeProcessed =$injector.invoke(eventProcessControl);
                    if(angular.isFunction(shouldEventBeProcessed )){
                        shouldEventBeProcessed = shouldEventBeProcessed(exerciseType, exercise, exerciseResult);
                    }
                    return $q.when(shouldEventBeProcessed);
                }

                childScope.$on(exerciseEventsConst.section.FINISH, function (evt, section, sectionResult, exam) {
                    _shouldEventBeProcessed(exerciseEventsConst.section.FINISH, section, sectionResult)
                        .then(function(shouldBeProcessed){
                            if(shouldBeProcessed){
                                var isDiagnostic = exam.typeId === ExamTypeEnum.DIAGNOSTIC.enum;
                                if (isDiagnostic) {
                                    _diagnosticSectionCompleteHandler(section, sectionResult);
                                }
                                var rawScore = _calculateRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult);
                                EstimatedScoreSrv.addRawScore(rawScore, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id, isDiagnostic);
                            }
                        });
                });

                function _baseExerciseFinishHandler(exerciseType, evt, exercise, exerciseResult) {
                    _shouldEventBeProcessed(exerciseType, exercise, exerciseResult).then(function(shouldBeProcessed){
                        if(shouldBeProcessed){
                            var rawScore = _calculateRawScore(exerciseType, exerciseResult);
                            EstimatedScoreSrv.addRawScore(rawScore, exerciseType, exercise.subjectId, exercise.id);
                        }
                    });
                }

                angular.forEach(ExerciseTypeEnum, function(enumObj, enumName){
                    if(enumName !== 'SECTION'){
                        var enumLowercaseName = enumName.toLowerCase();
                        var evtName = exerciseEventsConst[enumLowercaseName].FINISH;
                        childScope.$on(evtName, _baseExerciseFinishHandler.bind(EstimatedScoreEventsHandlerSrv, enumObj.enum));
                    }
                });

                EstimatedScoreEventsHandlerSrv.init = angular.noop;

                return EstimatedScoreEventsHandlerSrv;
            }
        ];

    });
})(angular);
