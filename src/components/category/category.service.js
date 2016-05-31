'use strict';

angular.module('znk.infra.category').service('CategoryService', function (StorageRevSrv, $q, categoryEnum)  {
        'ngInject';

        var self = this;
        this.get = function () {
            return StorageRevSrv.getContent({ exerciseType: 'category' });
        };

        var categoryMapObj;
        this.getCategoryMap = function () {
            if (categoryMapObj) {
                return $q.when(categoryMapObj);
            }
            return self.get().then(function (categories) {
                var categoryMap = {};
                angular.forEach(categories, function (item) {
                    categoryMap[item.id] = item;
                });
                categoryMapObj = categoryMap;
                return categoryMapObj;
            });
        };

        self.getCategoryData = function (categoryId) {
            return self.getCategoryMap().then(function (categoryMap) {
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
            if (category.typeId === categoryEnum.SUBJECT.enum) {
                return $q.when(category.id);
            }
            return self.getParentCategory(category.id).then(function (parentCategory) {
                return self.getSubjectIdByCategory(parentCategory);
            });
        };


        self.getTestScore = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.TEST_SCORE.enum === category.typeId) {
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
                            if (category.typeId === categoryEnum.GENERAL.enum) {
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
                            if (category.typeId === categoryEnum.SPECIFIC.enum) {
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
