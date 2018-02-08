(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreEventsHandlerSrv', function EstimatedScoreEventsHandler() {
        function pointsMap(correctWithinAllowedTimeFrame, correctAfterAllowedTimeFrame, wrongWithinAllowedTimeFrame, wrongAfterAllowedTimeFrame, correctTooFast, wrongTooFast) {
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

            if (angular.isDefined(correctTooFast)) {
                ret.correctTooFast = correctTooFast;
            }

            if (angular.isDefined(wrongTooFast)) {
                ret.wrongTooFast = wrongTooFast;
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
        this.setEventProcessControl = function (_eventProcessControl) {
            eventProcessControl = _eventProcessControl;
        };

        var getAnswerTimeSpentType = function () { // default function
            return 'Within';
        };

        this.setAnswerTimeSpentTypeFn = function (fn) {
            getAnswerTimeSpentType = fn;
        };


        this.$get = [
            '$rootScope', 'ExamTypeEnum', 'EstimatedScoreSrv', 'SubjectEnum', 'ExerciseTypeEnum', 'ExerciseAnswerStatusEnum', 'exerciseEventsConst', '$log', 'UtilitySrv', '$injector', '$q', 'CategoryService',
            function ($rootScope, ExamTypeEnum, EstimatedScoreSrv, SubjectEnum, ExerciseTypeEnum, ExerciseAnswerStatusEnum, exerciseEventsConst, $log, UtilitySrv, $injector, $q, CategoryService) {
                if (angular.equals({}, diagnosticScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if (angular.equals({}, exercisesRawScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                var EstimatedScoreEventsHandlerSrv = {};

                var childScope = $rootScope.$new(true);

                function _basePointsGetter(pointsMap, answerStatus, answerTimeType) {
                    var key;
                    if (answerStatus === ExerciseAnswerStatusEnum.unanswered.enum) {
                        key = 'unanswered';
                    } else {
                        key = answerStatus === ExerciseAnswerStatusEnum.correct.enum ? 'correct' : 'wrong';
                        key += answerTimeType;
                    }
                    return pointsMap[key];
                }

                function _getDiagnosticQuestionPoints(question, result) {
                    var pointsMap = diagnosticScoring[question.difficulty];
                    var answerStatus = result.isAnsweredCorrectly ? ExerciseAnswerStatusEnum.correct.enum : ExerciseAnswerStatusEnum.wrong.enum;
                    var answerTimeType = getAnswerTimeSpentType(result);
                    return _basePointsGetter(pointsMap, answerStatus, answerTimeType);
                }

                function _diagnosticSectionCompleteHandler(section, sectionResult) {
                    var scores = {};
                    var subjectIds = [];

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
                            var subjectId1 = (typeof question.subjectId === 'undefined' || question.subjectId === null) ?
                                CategoryService.getCategoryLevel1ParentByIdSync(question.categoryId) : question.subjectId;
                            var subjectId2 = (typeof question.subjectId === 'undefined' || question.subjectId === null) ?
                                CategoryService.getCategoryLevel1ParentByIdSync(question.categoryId2) : question.subjectId;
                            subjectIds = [subjectId1, subjectId2];
                            angular.forEach(subjectIds, function (subjectId) {
                                if (angular.isDefined(subjectId) && subjectId !== null) {
                                    if (angular.isUndefined(scores[subjectId])) {
                                        scores[subjectId] = 0;
                                    }
                                    scores[subjectId] += _getDiagnosticQuestionPoints(question, result);
                                }
                            });
                        }
                    });
                    angular.forEach(scores, function (score, subjectId) {
                        if(angular.isDefined(subjectId) && subjectId !== null) {
                            EstimatedScoreSrv.setDiagnosticSectionScore(score, ExerciseTypeEnum.SECTION.enum, subjectId, section.id);
                        }
                    });
                }

                function _getQuestionRawPoints(exerciseType, result) {
                    var answerTimeType = !result.afterAllowedTime ? 'Within' : 'After';

                    var answerStatus = ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum(result.isAnsweredCorrectly);

                    var rawPointsMap = exercisesRawScoring[exerciseType];
                    return _basePointsGetter(rawPointsMap, answerStatus, answerTimeType);
                }

                function _calculateRawScore(exerciseType, exerciseResult) {

                    if (!exercisesRawScoring[exerciseType]) {
                        $log.error('EstimatedScoreEventsHandlerSrv: raw scoring not exits for the following exercise type: ' + exerciseType);
                    }
                    var rawScores = {};
                    var questionResults = exerciseResult.questionResults;
                    questionResults.forEach(function (questionResult, index) {
                        if (angular.isUndefined(questionResult)) {
                            $log.error('EstimatedScoreEventsHandler: question for result is missing',
                                'exercise id: ', exerciseResult.id,
                                'result index: ', index
                            );
                            return;
                        } else {
                            var subjectId1 = (typeof questionResult.subjectId === 'undefined' || questionResult.subjectId === null) ?
                                CategoryService.getCategoryLevel1ParentByIdSync(questionResult.categoryId): questionResult.subjectId;
                            var subjectId2 = (typeof questionResult.subjectId === 'undefined' || questionResult.subjectId === null) ?
                                CategoryService.getCategoryLevel1ParentByIdSync(questionResult.categoryId2): questionResult.subjectId;
                            var subjectIds = [subjectId1, subjectId2];
                            angular.forEach(subjectIds, function (subjectId) {
                                if (angular.isDefined(subjectId) && subjectId !== null) {
                                    if (angular.isUndefined(rawScores[subjectId])) {
                                        rawScores[subjectId] = {
                                            total: questionResults.length * exercisesRawScoring[exerciseType].correctWithin,
                                            earned: 0
                                        };
                                    }
                                    rawScores[subjectId].earned += _getQuestionRawPoints(exerciseType, questionResult);
                                }
                            });
                        }
                    });

                    return rawScores;
                }

                function _shouldEventBeProcessed(exerciseType, exercise, exerciseResult) {
                    if (!eventProcessControl) {
                        return $q.when(true);
                    }

                    var shouldEventBeProcessed = $injector.invoke(eventProcessControl);
                    if (angular.isFunction(shouldEventBeProcessed)) {
                        shouldEventBeProcessed = shouldEventBeProcessed(exerciseType, exercise, exerciseResult);
                    }
                    return $q.when(shouldEventBeProcessed);
                }

                childScope.$on(exerciseEventsConst.section.FINISH, function (evt, section, sectionResult, exam) {
                    EstimatedScoreEventsHandlerSrv.calculateRawScore(exerciseEventsConst.section.FINISH, section, sectionResult, exam);
                });


                function _callCalculateAndSaveRawScore(exerciseTypeEnum, sectionResult, id, isDiagnostic) {
                    var rawScores = _calculateRawScore(exerciseTypeEnum, sectionResult);
                    angular.forEach(rawScores, function (rawScore, subjectId) {
                        EstimatedScoreSrv.addRawScore(rawScores[subjectId], exerciseTypeEnum, subjectId, id, isDiagnostic);
                    });
                }

                function _baseExerciseFinishHandler(exerciseType, evt, exercise, exerciseResult) {
                    _shouldEventBeProcessed(exerciseType, exercise, exerciseResult).then(function (shouldBeProcessed) {
                        if (shouldBeProcessed) {
                            _callCalculateAndSaveRawScore(exerciseType, exerciseResult, exercise.id);
                        }
                    });
                }


                angular.forEach(ExerciseTypeEnum, function (enumObj, enumName) {
                    if (enumName !== 'SECTION' && enumName !== 'LECTURE') {
                        var enumLowercaseName = enumName.toLowerCase();
                        var evtName = exerciseEventsConst[enumLowercaseName].FINISH;
                        childScope.$on(evtName, _baseExerciseFinishHandler.bind(EstimatedScoreEventsHandlerSrv, enumObj.enum));
                    }
                });

                EstimatedScoreEventsHandlerSrv.init = angular.noop;

                EstimatedScoreEventsHandlerSrv.calculateRawScore = function (exerciseEventsConstType, section, sectionResult, exam) {
                    _shouldEventBeProcessed(exerciseEventsConstType, section, sectionResult)
                        .then(function (shouldBeProcessed) {
                            if (shouldBeProcessed) {
                                var isDiagnostic = exam.typeId === ExamTypeEnum.DIAGNOSTIC.enum;
                                if (isDiagnostic) {
                                    _diagnosticSectionCompleteHandler(section, sectionResult);
                                }
                                _callCalculateAndSaveRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult, section.id, isDiagnostic);
                            }
                        });
                };
                return EstimatedScoreEventsHandlerSrv;
            }
        ];

    });
})(angular);
