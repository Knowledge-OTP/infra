'use strict';

angular.module('znk.infra.contentGetters').service('CategoryService',
    function (StorageRevSrv, $q, categoryEnum, $log, categoriesConstant) {
        'ngInject';

        var categoryMapObj;
        var self = this;

        var categoryEnumMap = categoryEnum.getEnumMap();

        self.get = function () {
            return StorageRevSrv.getContent({
                exerciseType: 'category'
            });
        };

        function mapCategories(categories) {
            var categoryMap = {};
            angular.forEach(categories, function (category) {
                categoryMap[category.id] = category;
            });
            categoryMapObj = categoryMap;
            return categoryMapObj;
        }

        self.getCategoryMap = function (sync) {
            var _categoryMapObj;

            if (categoryMapObj) {
                _categoryMapObj = categoryMapObj;
            } else {
                _categoryMapObj = mapCategories(categoriesConstant);
            }

            if (sync) {
                return _categoryMapObj;
            } else {
                return $q.when(_categoryMapObj);
            }
        };

        self.getCategoryDataSync = function (categoryId) {
            var categoryMap = self.getCategoryMap(true);
            return categoryMap[categoryId];
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

        self.getStatsKeyByCategoryId = function (categoryId) {
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            return categoryEnumMap[category.typeId];
        };

        self.getParentCategorySync = function (categoryId) {
            var categoriesMap = self.getCategoryMap(true);
            var parentId;
            if (categoriesMap[categoryId]) {
                parentId = categoriesMap[categoryId].parentId;
            } else {
                $log.error('category id was not found in the categories');
                return null;
            }
            return categoriesMap[parentId];
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

        self.getCategoryLevel1ParentByIdSync = function (categoryId) {
            if (!categoryId) {
                $log.debug('CategoryService: No category id', categoryId);
                return;
            }
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            if (categoryEnum.LEVEL1.enum === category.typeId) {
                return categoryId;
            }
            return self.getCategoryLevel1ParentById(category.parentId);
        };

        self.getCategoryLevel1ParentById = function (categoryId) {
            if (angular.isUndefined(categoryId) || categoryId === null) {
                return $q.when(null);
            }
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.SUBJECT.enum === category.typeId) {
                    return $q.when(categoryId);
                }
                return self.getCategoryLevel1ParentById(category.parentId);
            });
        };

        // self.getCategoryLevel1ParentSync = function (category) {
        //     if (!category) {
        //         $log.error("Category Service: Couldn't fetch category", category);
        //         return null;
        //     }
        //     if (category.typeId === categoryEnum.LEVEL1.enum) {
        //         return category.id;
        //     }
        //     var parentCategory = self.getParentCategorySync(category.id);
        //     return self.getCategoryLevel1ParentSync(parentCategory);
        // };

        // self.getCategoryLevel1Parent = function (category) {
        //     if (!category) {
        //         return $q.when(null);
        //     }

        //     if (category.typeId === categoryEnum.SUBJECT.enum) {
        //         return $q.when(category.id);
        //     }
        //     return self.getParentCategory(category.id).then(function (parentCategory) {
        //         return self.getCategoryLevel1Parent(parentCategory);
        //     });
        // };

        self.getCategoryLevel2ParentSync = function (categoryId) {
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            if (categoryEnum.LEVEL2.enum === category.typeId) {
                return category;
            }
            return self.getCategoryLevel2ParentSync(categoryId);
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

        self.getAllLevelCategoriesSync = function (level) {
            var categoriesMap = self.getCategoryMap(true);
            var levelCategories = {};
            angular.forEach(categoriesMap, function (category) {
                var numLevel = 1;
                var categoryDup = angular.copy(category);
                while (categoryDup.parentId !== null) {
                    categoryDup = categoriesMap[categoryDup.parentId];
                    numLevel++;
                }
                if (numLevel === level) {
                    levelCategories[category.id] = category;
                }
            });
            return levelCategories;
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

        // self.getAllLevel3Categories = (function () {
        //     var getAllLevel3CategoriesProm;
        //     return function () {
        //         if (!getAllLevel3CategoriesProm) {
        //             getAllLevel3CategoriesProm = self.getCategoryMap().then(function (categories) {
        //                 var generalCategories = {};
        //                 angular.forEach(categories, function (category) {
        //                     if (category.typeId === categoryEnum.GENERAL.enum) {
        //                         generalCategories[category.id] = category;
        //                     }
        //                 });
        //                 return generalCategories;
        //             });
        //         }
        //         return getAllLevel3CategoriesProm;
        //     };
        // })();

        // self.getAllLevel3CategoriesGroupedByLevel1 = (function () {
        //     var getAllLevel3CategoriesGroupedByLevel1Prom;
        //     return function (subjectId) {
        //         if (!getAllLevel3CategoriesGroupedByLevel1Prom) {
        //             getAllLevel3CategoriesGroupedByLevel1Prom = self.getAllLevel3Categories().then(function (categories) {
        //                 var generalCategories = {};
        //                 var promArray = [];
        //                 angular.forEach(categories, function (generalCategory) {
        //                     var prom = self.getCategoryLevel1Parent(generalCategory).then(function (currentCategorySubjectId) {
        //                         if (currentCategorySubjectId === subjectId) {
        //                             generalCategories[generalCategory.id] = generalCategory;
        //                         }
        //                     });
        //                     promArray.push(prom);
        //                 });
        //                 return $q.all(promArray).then(function () {
        //                     return generalCategories;
        //                 });
        //             });
        //         }
        //         return getAllLevel3CategoriesGroupedByLevel1Prom;
        //     };
        // })();

        self.getAllLevel4CategoriesSync = function () {
            var categoriesMap = self.getCategoryMap(true);
            var specificCategories = {};
            angular.forEach(categoriesMap, function (category) {
                if (category.typeId === categoryEnum.LEVEL4.enum) {
                    specificCategories[category.id] = category;
                } 
            });
            return specificCategories;
        };

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
