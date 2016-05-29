'use strict';

angular.module('znk.infra.category').service('SubScoreSrv', function(CategoryService, $q, StorageRevSrv, SubjectEnum) {
    'ngInject';

    function _getSubScoreCategoryData() {
        return StorageRevSrv.getContent({
            exerciseId: null,
            exerciseType: 'subscoreCategory'
        });
    }

    function _getSubScoreData(subScoreId) {
        return _getSubScoreCategoryData().then(function (subScoresCategoryData) {
            return subScoresCategoryData[subScoreId];
        });
    }

    this.getSpecificCategorySubScores = function (specificCategoryId) {
        return CategoryService.getCategoryData(specificCategoryId).then(function (specificCategoryData) {
            var allProm = [];
            var subScoreKeys = ['subScore1Id', 'subScore2Id'];
            angular.forEach(subScoreKeys, function (subScoreKey) {
                var subScoreId = specificCategoryData[subScoreKey];
                if (subScoreId || subScoreId === 0) {
                    allProm.push(_getSubScoreData(subScoreId));
                }
            });
            return $q.all(allProm);
        });
    };

    this.getAllSubScoresBySubject = (function () {
        var getAllSubjectScoresBySubjectProm;
        return function () {
            function _getMathOrVerbalSubjectIdIfCategoryNotEssay(category) {
                return CategoryService.getSubjectIdByCategory(category).then(function (subjectId) {
                    if (subjectId === SubjectEnum.MATH.enum || subjectId === SubjectEnum.VERBAL.enum) {
                        return subjectId;
                    }
                });
            }

            if (!getAllSubjectScoresBySubjectProm) {
                var allSubScoresProm = _getSubScoreCategoryData();
                var allSpecificCategoriesProm = CategoryService.getAllSpecificCategories();

                getAllSubjectScoresBySubjectProm = $q.all([allSubScoresProm, allSpecificCategoriesProm]).then(function (res) {
                    var allSubScores = res[0];
                    var allSpecificCategories = res[1];
                    var subScorePerSubject = {};
                    subScorePerSubject[SubjectEnum.MATH.enum] = {};
                    subScorePerSubject[SubjectEnum.VERBAL.enum] = {};
                    var specificCategoryKeys = Object.keys(allSpecificCategories);
                    var promArray = [];
                    var subScoreKeys = ['subScore1Id', 'subScore2Id'];

                    angular.forEach(specificCategoryKeys, function (specificCategoryId) {
                        var specificCategory = allSpecificCategories[specificCategoryId];
                        var prom = _getMathOrVerbalSubjectIdIfCategoryNotEssay(specificCategory).then(function (subjectId) {
                            if (angular.isDefined(subjectId)) {
                                angular.forEach(subScoreKeys, function (subScoreKey) {
                                    var subScoreId = specificCategory[subScoreKey];
                                    if (subScoreId !== null && angular.isUndefined(subScorePerSubject[subjectId][subScoreKey])) {
                                        subScorePerSubject[subjectId][subScoreId] = allSubScores[subScoreId];
                                    }
                                });
                            }
                        });
                        promArray.push(prom);
                    });

                    return $q.all(promArray).then(function () {
                        return subScorePerSubject;
                    });
                });
            }

            return getAllSubjectScoresBySubjectProm;
        };
    })();

    this.getSubScoreData = _getSubScoreData;
});
