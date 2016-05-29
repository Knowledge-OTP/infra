'use strict';
var CROSS_TEST_SCORE_ENUM = {
    0: { name: 'History / Social Studies' },
    1: { name: 'Science' }
};
angular.module('znk.infra.scoring').service('ScoringService', function($q, ExamTypeEnum, StorageRevSrv, $log, SubScoreSrv) {
    'ngInject';

    var keysMapConst = {
        crossTestScore: 'CrossTestScore',
        subScore: 'Subscore',
        miniTest: 'miniTest',
        test: 'test'
    };

    function _getScoreTableProm() {
        return StorageRevSrv.getContent({
            exerciseType: 'scoretable'
        }).then(function (scoreTable) {
            if (!scoreTable || !angular.isObject(scoreTable)) {
                var errMsg = 'ScoringService _getScoreTableProm: no scoreTable or scoreTable is not an object! scoreTable:' + scoreTable;
                $log.error(errMsg);
                return $q.reject(errMsg);
            }
            return scoreTable;
        });
    }

    function _getRawScore(questionsResults) {
        var score = 0;
        angular.forEach(questionsResults, function (question) {
            if (question.isAnsweredCorrectly) {
                score += 1;
            }
        });
        return score;
    }

    function _isTypeFull(typeId) {
        return ExamTypeEnum['FULL TEST'].enum === typeId;
    }

    function _getScoreTableKeyByTypeId(typeId) {
        return _isTypeFull(typeId) ? keysMapConst.test : keysMapConst.miniTest;
    }

    function _getDataFromTable(scoreTable, key, id, rawScore) {
        var data = angular.copy(scoreTable);
        if (angular.isDefined(key)) {
            data = data[key];
        }
        if (angular.isDefined(id)) {
            data = data[id];
        }
        if (angular.isDefined(rawScore)) {
            data = data[rawScore];
        }
        return data;
    }

    function _mergeSectionsWithResults(sections, sectionsResults) {
        return sections.reduce(function (previousValue, currentValue) {
            var currentSectionResult = sectionsResults.find(function (sectionResult) { return +sectionResult.exerciseId === currentValue.id; });
            previousValue.push(angular.extend({}, currentSectionResult, currentValue));
            return previousValue;
        }, []);
    }

    function _getResultsFn(scoreTable, questionsResults, typeId, id) {
        var rawScore = _getRawScore(questionsResults);
        var key = _getScoreTableKeyByTypeId(typeId);
        return _getDataFromTable(scoreTable, key, id, rawScore);
    }

    function _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId) {
        var data = _getResultsFn(scoreTable, questionsResults, typeId, categoryId);
        return {
            testScore: data
        };
    }

    function _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId) {
        var data = _getResultsFn(scoreTable, questionsResults, typeId, subjectId);
        return {
            sectionScore: data
        };
    }

    function _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults) {
        var mergeSections = _mergeSectionsWithResults(sections, sectionsResults);
        var subScoresMap = {};
        var crossTestScoresMap = {};
        var subScoresArrProms = [];
        angular.forEach(mergeSections, function (section) {
            angular.forEach(section.questionResults, function (questionResult) {
                var subScoresArrProm = SubScoreSrv.getSpecificCategorySubScores(questionResult.categoryId);
                subScoresArrProm.then(function (subScoresArr) {
                    if (subScoresArr.length > 0) {
                        angular.forEach(subScoresArr, function (subScore) {
                            if (!subScoresMap[subScore.id]) {
                                subScoresMap[subScore.id] = { raw: 0, name: subScore.name, subjectId: section.subjectId };
                            }
                            if (questionResult.isAnsweredCorrectly) {
                                subScoresMap[subScore.id].raw += 1;
                            }
                        });
                    }
                    return subScoresArr;
                });
                subScoresArrProms.push(subScoresArrProm);
                var crossTestScoreId = questionResult.crossTestScoreId;
                if (angular.isDefined(crossTestScoreId) && crossTestScoreId !== null) {
                    if (!crossTestScoresMap[crossTestScoreId]) {
                        crossTestScoresMap[crossTestScoreId] = { raw: 0, name: CROSS_TEST_SCORE_ENUM[crossTestScoreId].name };
                    }
                    if (questionResult.isAnsweredCorrectly) {
                        crossTestScoresMap[crossTestScoreId].raw += 1;
                    }
                }
            });
        });

        return $q.all(subScoresArrProms).then(function () {
            angular.forEach(subScoresMap, function (subScore, key) {
                subScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.subScore, key, subScore.raw);
            });
            angular.forEach(crossTestScoresMap, function (crossTestScores, key) {
                crossTestScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.crossTestScore, key, crossTestScores.raw);
            });
            return {
                subScores: subScoresMap,
                crossTestScores: crossTestScoresMap
            };
        });
    }

    // api

    this.isTypeFull = function (typeId) {
        return ExamTypeEnum['FULL TEST'].enum === typeId;
    };

    this.getTestScoreResult = function (questionsResults, typeId, categoryId) {
        return _getScoreTableProm().then(function (scoreTable) {
            return _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId);
        });
    };

    this.getSectionScoreResult = function (questionsResults, typeId, subjectId) {
        return _getScoreTableProm().then(function (scoreTable) {
            return _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId);
        });
    };

    this.getFullExamSubAndCrossScores = function (sections, sectionsResults) {
        return _getScoreTableProm().then(function (scoreTable) {
            return _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults);
        });
    };

    this.rawScoreToScore = function (subjectId, rawScore) {
        return _getScoreTableProm().then(function (scoreTable) {
            var roundedRawScore = Math.round(rawScore);
            return _getDataFromTable(scoreTable, keysMapConst.test, subjectId, roundedRawScore);
        });
    };

    this.getTotalScoreResult = function (scoresArr) {
        var totalScores = 0;
        angular.forEach(scoresArr, function (score) {
            totalScores += score;
        });
        return $q.when(totalScores);
    };
});

