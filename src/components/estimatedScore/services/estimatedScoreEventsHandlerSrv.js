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
                    var scoresPromises = [];

                    var questions = section.questions;
                    var questionsMap = UtilitySrv.array.convertToMap(questions);

                    sectionResult.questionResults.forEach(function (result, i) {
                        var scorePromise = $q(function (resolve, reject) {
                            var question = questionsMap[result.questionId];
                            if (angular.isUndefined(question)) {
                                $log.error('EstimatedScoreEventsHandler: question for result is missing',
                                    'section id: ', section.id,
                                    'result index: ', i
                                );
                                reject();
                            } else {
                                var subjectId1Prom = CategoryService.getCategoryLevel1ParentById(question.categoryId);
                                var subjectId2Prom = CategoryService.getCategoryLevel1ParentById(question.categoryId2);
                                $q.all([
                                    subjectId1Prom,
                                    subjectId2Prom
                                ]).then(function (subjectIds) {
                                    angular.forEach(subjectIds, function (subjectId) {
                                        if (angular.isNumber(subjectId)) {
                                            if (angular.isUndefined(scores[subjectId])) {
                                                scores[subjectId] = 0;
                                            }
                                            scores[subjectId] += _getDiagnosticQuestionPoints(question, result);
                                        }
                                    }); // forEach(subjectIds
                                    resolve();
                                }); // then
                            }
                        });
                        scoresPromises.push(scorePromise);
                    });

                    $q.all(scoresPromises).then(function () {
                        var subjectIds = Object.keys(scores);
                        subjectIds.forEach(function (subjectId) {
                            EstimatedScoreSrv.setDiagnosticSectionScore(scores[subjectId], ExerciseTypeEnum.SECTION.enum, subjectId, section.id);
                        });
                    });
                }

                function _getQuestionRawPoints(exerciseType, result) {
                    var answerTimeType = !result.afterAllowedTime ? 'Within' : 'After';

                    var answerStatus = ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum(result.isAnsweredCorrectly);

                    var rawPointsMap = exercisesRawScoring[exerciseType];
                    return _basePointsGetter(rawPointsMap, answerStatus, answerTimeType);
                }

                function _calculateRawScore(exerciseType, exerciseResult) {
                    var scoresPromises = $q(function (resolve) {
                        if (!exercisesRawScoring[exerciseType]) {
                            $log.error('EstimatedScoreEventsHandlerSrv: raw scoring not exits for the following exercise type: ' + exerciseType);
                        }
                        var rawScores = {};
                        var questionResults = exerciseResult.questionResults;
                        // var questionResultMap = UtilitySrv.array.convertToMap(questionResults, "questionId");
                        var rawScoresProms = [];
                        questionResults.forEach(function (quesionResult, index) {
                            var rawScorePromise = $q(function (resolve, reject) {
                                if (angular.isUndefined(quesionResult)) {
                                    $log.error('EstimatedScoreEventsHandler: question for result is missing',
                                        'exercise id: ', exerciseResult.id,
                                        'result index: ', index
                                    );
                                    reject();
                                } else {
                                    var subjectId1Prom = CategoryService.getCategoryLevel1ParentById(quesionResult.categoryId);
                                    var subjectId2Prom = CategoryService.getCategoryLevel1ParentById(quesionResult.categoryId2);

                                    $q.all([
                                        subjectId1Prom,
                                        subjectId2Prom
                                    ]).then(function (subjectIds) {
                                        subjectIds.forEach(function (subjectId) {
                                            if (angular.isNumber(subjectId)) {
                                                if (angular.isUndefined(rawScores[subjectId])) {
                                                    rawScores[subjectId] = {
                                                        total: questionResults.length * exercisesRawScoring[exerciseType].correctWithin,
                                                        earned: 0
                                                    };
                                                }
                                                rawScores[subjectId].earned += _getQuestionRawPoints(exerciseType, quesionResult);
                                            }
                                        });
                                        resolve();
                                    });
                                }
                            });
                            rawScoresProms.push(rawScorePromise);
                        });
                        $q.all(rawScoresProms).then(function () {
                            resolve(rawScores);
                        });

                    });
                    return scoresPromises;
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
                    EstimatedScoreEventsHandlerSrv.calculateRawScore(section, sectionResult, exam);
                });

                EstimatedScoreEventsHandlerSrv.calculateRawScore = function (exerciseEventsConst, section, sectionResult, exam) {
                    _shouldEventBeProcessed(exerciseEventsConst.section.FINISH, section, sectionResult)
                        .then(function (shouldBeProcessed) {
                            if (shouldBeProcessed) {
                                var isDiagnostic = exam.typeId === ExamTypeEnum.DIAGNOSTIC.enum;
                                if (isDiagnostic) {
                                    _diagnosticSectionCompleteHandler(section, sectionResult);
                                }
                                _callCalculateRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult, section.id, isDiagnostic);
                                // _calculateRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult).then(function (rawScores) {
                                //     var rawScoresKeys = Object.keys(rawScores);
                                //     rawScoresKeys.forEach(function (subjectId) {
                                //         var rawScore = rawScores[subjectId];
                                //         (function (rawScore) {
                                //             EstimatedScoreSrv.addRawScore(rawScore, ExerciseTypeEnum.SECTION.enum, subjectId, section.id, isDiagnostic);
                                //         })(rawScore);
                                //     });
                                // });
                            }
                        });
                };
                function _callCalculateRawScore(exerciseTypeEnum, sectionResult, id, isDiagnostic) {
                    _calculateRawScore(exerciseTypeEnum, sectionResult).then(function (rawScores) {
                        var rawScoresKeys = Object.keys(rawScores);
                        rawScoresKeys.forEach(function (subjectId) {
                            var rawScore = rawScores[subjectId];
                            (function (rawScore) {
                                EstimatedScoreSrv.addRawScore(rawScore, exerciseTypeEnum, subjectId, id, isDiagnostic);
                            })(rawScore);
                        });
                    });
                }

                function _baseExerciseFinishHandler(exerciseType, evt, exercise, exerciseResult) {
                    _shouldEventBeProcessed(exerciseType, exercise, exerciseResult).then(function (shouldBeProcessed) {
                        if (shouldBeProcessed) {
                            _callCalculateRawScore(exerciseType, exerciseResult, exercise.subjectId, exercise.id);
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

                return EstimatedScoreEventsHandlerSrv;
            }
        ];

    });
})(angular);
