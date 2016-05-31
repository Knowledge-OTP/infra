(function (angular) {
    'use strict';

    angular.module('znk.infra.scoring', ['znk.infra.storage', 'znk.infra.exerciseUtility']);
})(angular);

'use strict';
angular.module('znk.infra.scoring').service('ScoringService', function($q, ExamTypeEnum, StorageRevSrv, $log) {
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


angular.module('znk.infra.scoring').run(['$templateCache', function($templateCache) {

}]);