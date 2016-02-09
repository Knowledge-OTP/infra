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

                var EstimatedScoreSrv = {};

                var ESTIMATED_SCORE_RANGE = 30;
                var MIN_SUBJECT_SCORE = 200;
                var MAX_SUBJECT_SCORE = 800;

                function _getEstimatedScoreRange(estimatedScore, isTotal) {
                    var multBy = isTotal ? 3 : 1;//if exam then the score is the sum of all subjects
                    var minVal = MIN_SUBJECT_SCORE * multBy;
                    var maxVal = MAX_SUBJECT_SCORE * multBy;
                    return {
                        min: Math.max(estimatedScore.score - ESTIMATED_SCORE_RANGE, minVal),
                        max: Math.min(estimatedScore.score + ESTIMATED_SCORE_RANGE, maxVal)
                    };
                }

                function _baseGetter(key, subjectId) {
                    return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScore) {
                        if (angular.isUndefined(subjectId)) {
                            return estimatedScore[key];
                        }
                        return estimatedScore[key][subjectId];
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

                function _isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId) {
                    var exerciseKey = exerciseType + '_' + exerciseId;
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

                EstimatedScoreSrv.getEstimatedScoreRanges = function () {
                    return EstimatedScoreSrv.getEstimatedScores().then(function (estimatedScores) {
                        var ret = {};
                        var totalEstimatedScore = 0;

                        var subjectEnumArr = SubjectEnum.getEnumArr().map(function (item) {
                            return item.enum;
                        });

                        subjectEnumArr.forEach(function (subjectId) {
                            ret[subjectId] = {};

                            var estimatedScoreForSubject;
                            if (estimatedScores[subjectId]) {
                                estimatedScoreForSubject = estimatedScores[subjectId][estimatedScores[subjectId].length - 1];
                            }

                            if (estimatedScoreForSubject) {
                                totalEstimatedScore += estimatedScoreForSubject.score;
                                ret[subjectId] = _getEstimatedScoreRange(estimatedScoreForSubject);
                            }
                        });

                        if (totalEstimatedScore) {
                            ret.total = _getEstimatedScoreRange({score: totalEstimatedScore}, true);
                        }

                        return ret;
                    });
                };

                EstimatedScoreSrv.getEstimatedScores = _baseGetter.bind(this, 'estimatedScores');

                EstimatedScoreSrv.getSectionsRawScores = _baseGetter.bind(this, 'sectionsRawScores');

                EstimatedScoreSrv.getExercisesRawScore = _baseGetter.bind(this, 'exercisesRawScores');

                EstimatedScoreSrv.getLatestEstimatedScore = function(subjectId){
                    return _baseGetter('estimatedScores',subjectId).then(function(allScoresOrScoreForSubject){
                        if(angular.isDefined(subjectId)){
                            if(!allScoresOrScoreForSubject.length){
                                return {};
                            }
                            return allScoresOrScoreForSubject[allScoresOrScoreForSubject.length - 1];
                        }
                        var latestScoresPerSubject = {};
                        angular.forEach(allScoresOrScoreForSubject,function(scoresForSubject,subjectId){
                            latestScoresPerSubject[subjectId] = scoresForSubject.length ? scoresForSubject[scoresForSubject.length -1] : {};
                        });
                        return latestScoresPerSubject;
                    });
                };

                EstimatedScoreSrv.setDiagnosticSectionScore = function (score, exerciseType, subjectId, exerciseId) {
                    return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                        //score was already set
                        if (estimatedScoreData.estimatedScores[subjectId].length) {
                            return $q.reject('Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId);
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
                    });
                };

                EstimatedScoreSrv.addRawScore = function (rawScore, exerciseType, subjectId, exerciseId, isDiagnostic) {
                    return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                        if (_isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId)) {
                            return $q.reject('Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId);
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
                    });
                };

                return EstimatedScoreSrv;
            }];
    });
})(angular);
