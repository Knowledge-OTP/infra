'use strict';

(function (angular) {
    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreSrv',function(){

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

        this.$get = [
            'EstimatedScoreHelperSrv', 'ExerciseTypeEnum', '$injector', '$q', 'SubjectEnum', '$log',
            function (EstimatedScoreHelperSrv, ExerciseTypeEnum, $injector, $q, SubjectEnum, $log) {
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
