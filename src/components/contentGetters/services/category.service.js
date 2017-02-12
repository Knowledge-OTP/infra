'use strict';

angular.module('znk.infra.contentGetters').service('CategoryService',
    function (StorageRevSrv, $q, categoryEnum, $log, categoriesConstant) {
        'ngInject';

        $log.debug(categoriesConstant);
        var categories = categoriesConstant;

        var categoryMapObj;
        var self = this;

        self.get = function () {
            return StorageRevSrv.getContent({
                exerciseType: 'category'
            });
        };

        function mapCategories (categories) {
            var categoryMap = {};
            angular.forEach(categories, function (category) {
                categoryMap[category.id] = category;
            });
            categoryMapObj = categoryMap;
            return categoryMapObj;
        }

        self.getCategoryMap = function (sync) {
            if (sync) {
                if (categoryMapObj) {
                    return categoryMapObj;
                }
                return mapCategories(categories);
            } else {
                if (categoryMapObj){
                    return $q.when(categoryMapObj);
                }
                return self.get().then(function (categories) {
                return mapCategories(categories);
                });
            }
        };

        self.getCategoryData = function (categoryId) {
            return self.getCategoryMap().then(function (categoryMap) {
                return categoryMap[categoryId];
            });
        };

        self.categoryName = function (categoryId) {
            return self.getCategoryMap().then(function (categoryMap) {
                return categoryMap[categoryId];
            });
        };

        self.getParentCategory = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var parentId;
                if (categories[categoryId]) {
                    parentId = categories[categoryId].parentId;
                } else {
                    $log.error('category id was not found in the categories');
                    return null;
                }
                return categories[parentId];
            });
        };

        self.getCategoryLevel1ParentById = function (categoryId, sync) {
            //by default sync = false;
            if (angular.isUndefined(categoryId) || categoryId === null) {
                return $q.when(null);
            }
            if(!sync) {
                return self.getCategoryMap().then(function (categories) {
                    var category = categories[categoryId];
                    if (categoryEnum.SUBJECT.enum === category.typeId) {
                        return $q.when(categoryId);
                    }
                    return self.getCategoryLevel1ParentById(category.parentId, sync);
                });
            } else {
                if(!categories) {
                    $log.error('CategoryService: categories json is not available. try "getCategoryLevel1ParentById(categoryId, false)" for async approach');
                    return;
                } else {
                    var categoriesMap = categoriesMap ? categoriesMap : self.getCategoryMap(sync);
                    var category = categoriesMap[categoryId];
                    if (categoryEnum.SUBJECT.enum === category.typeId) {
                        return categoryId;
                    }
                    return self.getCategoryLevel1ParentById(category.parentId, sync);
                }
            }
        };

        self.getCategoryLevel1Parent = function (category) {
            if (!category) {
                return $q.when(null);
            }

            if (category.typeId === categoryEnum.SUBJECT.enum) {
                return $q.when(category.id);
            }
            return self.getParentCategory(category.id).then(function (parentCategory) {
                return self.getCategoryLevel1Parent(parentCategory);
            });
        };

        self.getCategoryLevel2Parent = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.TEST_SCORE.enum === category.typeId) {
                    return category;
                }
                return self.getCategoryLevel2Parent(category.parentId);
            });
        };

        self.getAllLevelCategories = function (level) {
            return self.getCategoryMap().then(function (categories) {
                var levelCategories = {};
                angular.forEach(categories, function (category) {
                    var numLevel = 1;
                    var catgoryDup = angular.copy(category);
                    while (catgoryDup.parentId !== null) {
                        catgoryDup = categories[catgoryDup.parentId];
                        numLevel++;
                    }
                    if (numLevel === level) {
                        levelCategories[category.id] = category;
                    }
                });
                return levelCategories;
            });
        };

        self.getAllLevel3Categories = (function () {
            var getAllLevel3CategoriesProm;
            return function () {
                if (!getAllLevel3CategoriesProm) {
                    getAllLevel3CategoriesProm = self.getCategoryMap().then(function (categories) {
                        var generalCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.GENERAL.enum) {
                                generalCategories[category.id] = category;
                            }
                        });
                        return generalCategories;
                    });
                }
                return getAllLevel3CategoriesProm;
            };
        })();

        self.getAllLevel3CategoriesGroupedByLevel1 = (function () {
            var getAllLevel3CategoriesGroupedByLevel1Prom;
            return function (subjectId) {
                if (!getAllLevel3CategoriesGroupedByLevel1Prom) {
                    getAllLevel3CategoriesGroupedByLevel1Prom = self.getAllLevel3Categories().then(function (categories) {
                        var generalCategories = {};
                        var promArray = [];
                        angular.forEach(categories, function (generalCategory) {
                            var prom = self.getCategoryLevel1Parent(generalCategory).then(function (currentCategorySubjectId) {
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
                return getAllLevel3CategoriesGroupedByLevel1Prom;
            };
        })();

        self.getAllLevel4Categories = (function () {
            var getAllLevel4CategoriessProm;
            return function () {
                if (!getAllLevel4CategoriessProm) {
                    getAllLevel4CategoriessProm = self.getCategoryMap().then(function (categories) {
                        var specificCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.SPECIFIC.enum) {
                                specificCategories[category.id] = category;
                            }
                        });
                        return specificCategories;
                    });
                }
                return getAllLevel4CategoriessProm;
            };
        })();
    });
