(function (angular) {
    'use strict';

    angular.module('znk.infra.category', ['znk.infra.storage', 'znk.infra.enum']);
})(angular);

'use strict';

angular.module('znk.infra.category').service('CategoryService', function (StorageRevSrv, $q, EnumSrv)  {
        'ngInject';

    var categoryEnum = {};

    categoryEnum.categoryTypeEnum = new EnumSrv.BaseEnum([
        ['TUTORIAL', 1, 'tutorial'],
        ['EXERCISE', 2, 'exercise'],
        ['MINI_CHALLENGE', 3, 'miniChallenge'],
        ['SECTION', 4, 'section'],
        ['DRILL', 5, 'drill'],
        ['GENERAL', 6, 'general'],
        ['SPECIFIC', 7, 'specific'],
        ['STRATEGY', 8, 'strategy'],
        ['SUBJECT', 9, 'subject'],
        ['SUB_SCORE', 10, 'subScore'],
        ['TEST_SCORE', 11, 'testScore']
    ]);

        var self = this;
        this.get = function () {
            return StorageRevSrv.getContent({ exerciseType: 'category' });
        };

        var categoryMapObj;
        this.getCategoryMap = function () {
            if (categoryMapObj) {
                return $q.when(categoryMapObj);
            }
            return self.get().then(categories => {
                var categoryMap = {};
                angular.forEach(categories, item => {
                    categoryMap[item.id] = item;
                });
                categoryMapObj = categoryMap;
                return categoryMapObj;
            });
        };

        self.getCategoryData = function (categoryId) {
            return self.getCategoryMap().then(categoryMap => {
                return categoryMap[categoryId];
            });
        };

        self.getParentCategory = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var parentId = categories[categoryId].parentId;
                return categories[parentId];
            });
        };

        self.getSubjectIdByCategory = function (category) {
            if (category.typeId === categoryEnum.categoryTypeEnum.SUBJECT.enum) {
                return $q.when(category.id);
            }
            return self.getParentCategory(category.id).then(function (parentCategory) {
                return self.getSubjectIdByCategory(parentCategory);
            });
        };


        self.getTestScore = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.categoryTypeEnum.TEST_SCORE.enum === category.typeId) {
                    return category;
                }
                return self.getTestScore(category.parentId);
            });
        };

        self.getAllGeneralCategories = (function () {
            var getAllGeneralCategoriesProm;
            return function () {
                if (!getAllGeneralCategoriesProm) {
                    getAllGeneralCategoriesProm = self.getCategoryMap().then(function (categories) {
                        var generalCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.categoryTypeEnum.GENERAL.enum) {
                                generalCategories[category.id] = category;
                            }
                        });
                        return generalCategories;
                    });
                }
                return getAllGeneralCategoriesProm;
            };
        })();

        self.getAllGeneralCategoriesBySubjectId = (function () {
            var getAllGeneralCategoriesBySubjectIdProm;
            return function (subjectId) {
                if (!getAllGeneralCategoriesBySubjectIdProm) {
                    getAllGeneralCategoriesBySubjectIdProm = self.getAllGeneralCategories().then(function (categories) {
                        var generalCategories = {};
                        var promArray = [];
                        angular.forEach(categories, function (generalCategory) {
                            var prom = self.getSubjectIdByCategory(generalCategory).then(function (currentCategorySubjectId) {
                                if (currentCategorySubjectId === subjectId) {
                                    generalCategories[generalCategory.id] = generalCategory;
                                }
                            });
                            promArray.push(prom);
                        });
                        return $q.all(promArray).then(function () {
                            return generalCategories;
                        });
                    });
                }
                return getAllGeneralCategoriesBySubjectIdProm;
            };
        })();

        self.getAllSpecificCategories = (function () {
            var getAllSpecificCategoriesProm;
            return function () {
                if (!getAllSpecificCategoriesProm) {
                    getAllSpecificCategoriesProm = self.getCategoryMap().then(function (categories) {
                        var specificCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.categoryTypeEnum.SPECIFIC.enum) {
                                specificCategories[category.id] = category;
                            }
                        });
                        return specificCategories;
                    });
                }
                return getAllSpecificCategoriesProm;
            };
        })();
});

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

angular.module('znk.infra.category').run(['$templateCache', function($templateCache) {

}]);
