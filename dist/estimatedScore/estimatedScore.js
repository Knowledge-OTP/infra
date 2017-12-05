(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore', [
            'znk.infra.config',
            'znk.infra.znkExercise',
            'znk.infra.contentGetters',
            'znk.infra.utility'
        ])
        .run(
            ["EstimatedScoreEventsHandlerSrv", function (EstimatedScoreEventsHandlerSrv) {
                'ngInject';
                EstimatedScoreEventsHandlerSrv.init();
            }]);
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreSrv',function(){
        'ngInject';
        var subjectsRawScoreEdges;
        this.setSubjectsRawScoreEdges = function(_subjectsRawScoreEdges){
            subjectsRawScoreEdges = _subjectsRawScoreEdges;
        };

        var rawScoreToScoreFnGetter;
        this.setRawScoreToRealScoreFn = function(_rawScoreToScoreFnGetter){
            rawScoreToScoreFnGetter = _rawScoreToScoreFnGetter;
        };

        var minDiagnosticScore;
        var maxDiagnosticScore;
        this.setMinMaxDiagnosticScore = function(minScore, maxScore){
            minDiagnosticScore = minScore;
            maxDiagnosticScore = maxScore;
        };

        this.$get = ["EstimatedScoreHelperSrv", "ExerciseTypeEnum", "$injector", "$q", "SubjectEnum", "$log", function (EstimatedScoreHelperSrv, ExerciseTypeEnum, $injector, $q, SubjectEnum, $log) {
                if(!subjectsRawScoreEdges){
                    $log.error('EstimatedScoreSrv: subjectsRawScoreEdges was not set');
                }

                if(!rawScoreToScoreFnGetter){
                    $log.error('EstimatedScoreSrv: rawScoreToScoreFnGetter was not set !!!');
                }

                var processingData = $q.when();

                var EstimatedScoreSrv = {};

                function _baseGetter(key, subjectId) {
                    return processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScore) {
                            if (angular.isUndefined(subjectId)) {
                                return estimatedScore[key];
                            }
                            return estimatedScore[key][subjectId];
                        });
                    });
                }

                function _calculateNormalizedRawScore(sectionSubjectRawScores, exerciseSubjectRawScore, subjectId) {
                    var sectionsWithWeightTotalPoints = 0;
                    var sectionsWithWeightEarnedPoints = 0;
                    var sectionsTotalPoints = 0;
                    sectionSubjectRawScores.forEach(function (sectionRawScore, index) {
                        sectionsTotalPoints += sectionRawScore.total;
                        var multiBy = +index + 1;
                        sectionsWithWeightTotalPoints += sectionRawScore.total * multiBy;
                        sectionsWithWeightEarnedPoints += sectionRawScore.earned * multiBy;
                    });
                    var combinedSectionRawScore = {
                        total: sectionsTotalPoints,
                        earned: sectionsTotalPoints * sectionsWithWeightEarnedPoints / sectionsWithWeightTotalPoints
                    };
                    if(isNaN(combinedSectionRawScore.earned)){
                        combinedSectionRawScore.earned = 0;
                    }

                    var rawScore = (2 / 3) * combinedSectionRawScore.earned + (1 / 3) * exerciseSubjectRawScore.earned;
                    var maxRawScore = (2 / 3) * combinedSectionRawScore.total + (1 / 3) * exerciseSubjectRawScore.total;
                    var subjectRawScoreEdges = subjectsRawScoreEdges[subjectId];
                    if(angular.isUndefined(subjectRawScoreEdges)){
                        $log.error('EstimatedScoreSrv: subjectRawScoreEdges was not defined for the following subject: ' + subjectId);
                    }
                    var normalizedScore = subjectRawScoreEdges.max * rawScore / maxRawScore;
                    return Math.max(normalizedScore, subjectRawScoreEdges.min);//verify result is higher than min
                }

                function _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore, addLimitToNewEstimatedScore) {
                    return _getScoreByRawScore(subjectId, normalizedRawScore).then(function (newEstimatedScore) {
                        if (!currEstimatedScore) {
                            return newEstimatedScore;
                        }

                        if (addLimitToNewEstimatedScore && Math.abs(newEstimatedScore - currEstimatedScore) > (newEstimatedScore * 0.05)) {
                            return currEstimatedScore + (newEstimatedScore - currEstimatedScore > 0 ? 1 : -1) * newEstimatedScore * 0.05;
                        }
                        return +newEstimatedScore.toFixed(2);
                    });
                }

                function _isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId, subjectId) {
                    var exerciseKey = exerciseType + '_' + exerciseId + '_' + subjectId;
                    if (estimatedScoreData.processedExercises.indexOf(exerciseKey) !== -1) {
                        return true;
                    }
                    estimatedScoreData.processedExercises.push(exerciseKey);
                }

                var _getScoreByRawScore = (function (){
                    var rawScoreToScoreFn = $injector.invoke(rawScoreToScoreFnGetter);
                    return function(subjectId, normalizedRawScore){
                        return $q.when(rawScoreToScoreFn(subjectId,normalizedRawScore));
                    };
                })();

                var convertObjScoreToRoundScore = function (obj) {
                    obj.score = Math.round(obj.score);
                    return obj;
                };

                EstimatedScoreSrv.getSectionsRawScores = _baseGetter.bind(this, 'sectionsRawScores');

                EstimatedScoreSrv.getExercisesRawScore = _baseGetter.bind(this, 'exercisesRawScores');

                EstimatedScoreSrv.getEstimatedScores = function (subjectId){
                    return _baseGetter('estimatedScores', subjectId).then(function (allScoresOrScoreForSubject) {
                        if (angular.isDefined(subjectId)) {
                            if (!allScoresOrScoreForSubject.length) {
                                return {};
                            }
                            return allScoresOrScoreForSubject.map(convertObjScoreToRoundScore);
                        }
                        var allScoresPerSubject = {};
                        angular.forEach(allScoresOrScoreForSubject, function (scoresForSubject, subjectId) {
                            allScoresPerSubject[subjectId] = scoresForSubject.length ? scoresForSubject.map(convertObjScoreToRoundScore) : [];
                        });

                        return allScoresPerSubject;
                    });
                };

                EstimatedScoreSrv.getLatestEstimatedScore = function (subjectId) {
                    return _baseGetter('estimatedScores',subjectId).then(function (allScoresOrScoreForSubject) {
                        if (angular.isDefined(subjectId)){
                            if (!allScoresOrScoreForSubject.length) {
                                return {};
                            }
                            return convertObjScoreToRoundScore(allScoresOrScoreForSubject[allScoresOrScoreForSubject.length - 1]);
                        }
                        var latestScoresPerSubject = {};
                        angular.forEach(allScoresOrScoreForSubject, function (scoresForSubject, subjectId) {
                            latestScoresPerSubject[subjectId] = scoresForSubject.length ? convertObjScoreToRoundScore(scoresForSubject[scoresForSubject.length -1]) : {};
                        });

                        return latestScoresPerSubject;
                    });
                };

                EstimatedScoreSrv.setDiagnosticSectionScore = function (score, exerciseType, subjectId, exerciseId) {
                    processingData = processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                            //score was already set
                            if (estimatedScoreData.estimatedScores[subjectId].length) {
                                var errMsg = 'Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId;
                                $log.info(errMsg);
                                return $q.reject(errMsg);
                            }

                            score = Math.max(minDiagnosticScore, Math.min(maxDiagnosticScore, score));
                            estimatedScoreData.estimatedScores[subjectId].push({
                                exerciseType: exerciseType,
                                exerciseId: exerciseId,
                                score: score,
                                time: Date.now()
                            });
                            return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData).then(function () {
                                return estimatedScoreData.estimatedScores[subjectId][estimatedScoreData.estimatedScores[subjectId].length - 1];
                            });
                        }).catch(function(errMsg){
                            $log.info(errMsg);
                        });
                    });
                    return processingData;
                };

                EstimatedScoreSrv.addRawScore = function (rawScore, exerciseType, subjectId, exerciseId, isDiagnostic) {
                    processingData = processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                            if (_isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId, subjectId)) {
                                var errMsg = 'Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId;
                                return $q.reject(errMsg);
                            }
                            if (exerciseType === ExerciseTypeEnum.SECTION.enum) {
                                var sectionSubjectRowScores = estimatedScoreData.sectionsRawScores[subjectId];
                                var newSectionSubjectRawScore = {
                                    exerciseType: exerciseType,
                                    exerciseId: exerciseId,
                                    time: Date.now()
                                };
                                angular.extend(newSectionSubjectRawScore, rawScore);
                                sectionSubjectRowScores.push(newSectionSubjectRawScore);
                            } else {
                                var exerciseSubjectRawScore = estimatedScoreData.exercisesRawScores[subjectId];
                                exerciseSubjectRawScore.exerciseType = exerciseType;
                                exerciseSubjectRawScore.exerciseId = exerciseId;
                                exerciseSubjectRawScore.time = Date.now();
                                exerciseSubjectRawScore.total += rawScore.total;
                                exerciseSubjectRawScore.earned += rawScore.earned;
                            }

                            if (!isDiagnostic) {
                                var normalizedRawScore = _calculateNormalizedRawScore(estimatedScoreData.sectionsRawScores[subjectId], estimatedScoreData.exercisesRawScores[subjectId], subjectId);
                                var estimatedScoresForSpecificSubject = estimatedScoreData.estimatedScores[subjectId];
                                var currEstimatedScore = estimatedScoresForSpecificSubject[estimatedScoresForSpecificSubject.length - 1] || {};
                                return _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore.score, exerciseType !== ExerciseTypeEnum.SECTION.enum).then(function (newEstimatedScore) {
                                    estimatedScoreData.estimatedScores[subjectId].push({
                                        exerciseType: exerciseType,
                                        exerciseId: exerciseId,
                                        score: newEstimatedScore,
                                        time: Date.now()
                                    });
                                    return estimatedScoreData;
                                });
                            }
                            return estimatedScoreData;
                        }).then(function (estimatedScoreData) {
                            return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData);
                        }).catch(function(errMsg){
                            $log.info(errMsg);
                        });
                    });
                    return processingData;
                };

                return EstimatedScoreSrv;
            }];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreEventsHandlerSrv',
        function EstimatedScoreEventsHandler() {
            'ngInject';

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


            this.$get = ["$rootScope", "ExamTypeEnum", "EstimatedScoreSrv", "SubjectEnum", "ExerciseTypeEnum", "ExerciseAnswerStatusEnum", "exerciseEventsConst", "$log", "UtilitySrv", "$injector", "$q", "CategoryService", function ($rootScope, ExamTypeEnum, EstimatedScoreSrv, SubjectEnum, ExerciseTypeEnum,
                                  ExerciseAnswerStatusEnum, exerciseEventsConst, $log, UtilitySrv, $injector, $q,
                                  CategoryService) {
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
                            var subjectId1 = CategoryService.getCategoryLevel1ParentByIdSync(question.categoryId);
                            var subjectId2 = CategoryService.getCategoryLevel1ParentByIdSync(question.categoryId2);
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
                        if (angular.isDefined(subjectId) && subjectId !== null) {
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
                            var subjectId1 = CategoryService.getCategoryLevel1ParentByIdSync(questionResult.categoryId);
                            var subjectId2 = CategoryService.getCategoryLevel1ParentByIdSync(questionResult.categoryId2);
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
            }];

        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').service('EstimatedScoreHelperSrv',
        ["SubjectEnum", "InfraConfigSrv", "StorageSrv", function (SubjectEnum, InfraConfigSrv, StorageSrv) {
            'ngInject';

            var EstimatedScoreHelperSrv = this;

            var ESTIMATE_SCORE_PATH = StorageSrv.variables.appUserSpacePath + '/estimatedScore';

            function _SetSubjectInitialVal(obj, initValue) {
                var subjectKeys = Object.keys(SubjectEnum);
                for (var i in subjectKeys) {
                    var subjectEnum = SubjectEnum[subjectKeys[i]];
                    obj[subjectEnum.enum] = angular.copy(initValue);
                }
            }

            EstimatedScoreHelperSrv.getEstimatedScoreData = function(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(ESTIMATE_SCORE_PATH).then(function(estimatedScore){
                        var defaultValues = {
                            estimatedScores: {},
                            sectionsRawScores:{},
                            exercisesRawScores: {},
                            processedExercises: []
                        };

                        _SetSubjectInitialVal(defaultValues.estimatedScores,[]);
                        _SetSubjectInitialVal(defaultValues.sectionsRawScores,[]);
                        var rawScoreInitialObject = {
                            total: 0,
                            earned: 0
                        };
                        _SetSubjectInitialVal(defaultValues.exercisesRawScores,rawScoreInitialObject);

                        angular.forEach(defaultValues, function(defaultVal, defaultValKey){
                            if(angular.isUndefined(estimatedScore[defaultValKey])){
                                estimatedScore[defaultValKey] = defaultVal ;
                            }

                            if(estimatedScore[defaultValKey] !== defaultVal && angular.isObject(defaultVal)){
                                var currVal = estimatedScore[defaultValKey];
                                angular.forEach(defaultVal, function(innerDefaultVal, innerDefaultValueKey){
                                    if(angular.isUndefined(currVal[innerDefaultValueKey])){
                                        currVal[innerDefaultValueKey] = innerDefaultVal;
                                    }
                                });
                            }
                        });

                        return estimatedScore;
                    });
                });
            };

            EstimatedScoreHelperSrv.setEstimateScoreData = function (newEstimateScoreData){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.set(ESTIMATE_SCORE_PATH,newEstimateScoreData);
                });
            };
        }]
    );
})(angular);

angular.module('znk.infra.estimatedScore').run(['$templateCache', function ($templateCache) {

}]);
