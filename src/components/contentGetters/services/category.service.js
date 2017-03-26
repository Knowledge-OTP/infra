'use strict';

angular.module('znk.infra.contentGetters').service('CategoryService',
    function (StorageRevSrv, $q, categoryEnum, $log, categoriesConstant, InfraConfigSrv, StorageSrv) {
        'ngInject';

        var categoryMapObj;
        var self = this;
        var USER_SELECTED_TEST_LEVEL_PATH = StorageSrv.variables.appUserSpacePath + '/selectedTestLevel';

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
            return $q.when(self.getCategoryDataSync(categoryId));
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
            return $q.when(self.getParentCategorySync(categoryId));
        };

        self.getCategoryLevel1ParentSync = function (categoriesArr) {
            for (var i = 0; i < categoriesArr.length; i++) {
                if (angular.isDefined(categoriesArr[i]) && categoriesArr[i] !== null) {
                    return self.getCategoryLevel1ParentByIdSync(categoriesArr[i]);
                }
            }
        };

        self.getCategoryLevel1ParentByIdSync = function (categoryId) {
            if (angular.isUndefined(categoryId) || categoryId === null) {
                return;
            }
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            if (categoryEnum.LEVEL1.enum === category.typeId) {
                return categoryId;
            }
            return self.getCategoryLevel1ParentByIdSync(category.parentId);
        };

        self.getCategoryLevel1ParentById = function (categoryId) {
            return $q.when(self.getCategoryLevel1ParentByIdSync(categoryId));
        };

        self.getCategoryLevel2ParentSync = function (categoryId) {
            if (angular.isUndefined(categoryId) || categoryId === null) {
                return;
            }
            var categoriesMap = self.getCategoryMap(true);
            var category = categoriesMap[categoryId];
            if (categoryEnum.LEVEL2.enum === category.typeId) {
                return category;
            }
            return self.getCategoryLevel2ParentSync(category.parentId);
        };

        self.getCategoryLevel2Parent = function (categoryId) {
            return $q.when(self.getCategoryLevel2ParentSync(categoryId));
        };

        self.getAllLevelCategoriesSync = function (level) {
            if (angular.isUndefined(level) || level === null) {
                return;
            }
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
            return $q.when(self.getAllLevelCategoriesSync(level));
        };

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

        self.getAllLevel4Categories = function () {
            return $q.when(self.getAllLevel4CategoriesSync());
        };

        self.getUserSelectedLevel1Category = function () {
            return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                return StudentStorageSrv.get(USER_SELECTED_TEST_LEVEL_PATH);
            }).catch(function (err) {
                $log.debug('CategoryService: getUserSelectedLevel1Category failed to get data', err);
            });
        };
        self.setUserSelectedLevel1Category = function (selectedTestLevel) {
            return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                return StudentStorageSrv.set(USER_SELECTED_TEST_LEVEL_PATH, selectedTestLevel);
            }).catch(function (err) {
                $log.debug('CategoryService: setUserSelectedLevel1Category failed to set data', err);
            });
        };
    });
