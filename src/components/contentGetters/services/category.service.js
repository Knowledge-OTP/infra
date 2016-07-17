'use strict';

angular.module('znk.infra.contentGetters').service('CategoryService', function (StorageRevSrv, $q, SubjectEnum, $log)  {
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

        this.categoryName = function (categoryId) {
            return this.getCategoryMap().then(function(categoryMap){
                return categoryMap[categoryId];
            });
        };

        this.getParentCategory = function (categoryId) {
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

        this.getAllSubscores = function () {
            return this.getCategoryMap().then(function (categories) {
                var subScoreObj = {};
                for (var prop in categories) {
                    if (_isSubScore(categories[prop].parentId)) {
                        subScoreObj[categories[prop].id] = categories[prop];
                    }
                }
                return subScoreObj;
            });
        };
        function _isSubScore(id) {
            return SubjectEnum.MATH.enum === id || SubjectEnum.READING.enum === id ||
                SubjectEnum.WRITING.enum === id || SubjectEnum.ENGLISH.enum === id ||
                SubjectEnum.SCIENCE.enum === id;
        }
    
});



