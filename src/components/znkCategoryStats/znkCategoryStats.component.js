(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats')
        .component('znkCategoryStats', {
            bindings: {
                categoryId: '='
            },
            templateUrl: 'components/znkCategoryStats/znkCategoryStats.template.html',
            controllerAs: 'vm',
            controller: function (StatsSrv, CategoryService, $q) {
                'ngInject';
                var vm = this;
                var PERCENTAGE = 100;
                var MILLISECOND = 1000;

                buildUiCategory(vm.categoryId);

                function buildUiCategory(categoryId) {
                    var dataPromMap = {};
                    dataPromMap.stats = StatsSrv.getStatsByCategoryId(categoryId);
                    dataPromMap.category = CategoryService.getCategoryData(categoryId);

                    $q.all(dataPromMap).then(function (data) {
                        var userStats = data.stats;
                        var category = data.category;

                        var extendObj = {};
                        extendObj.progress = getProgress(userStats);
                        extendObj.avgTime = getAvgTime(userStats);

                        vm.category = angular.extend(category, extendObj);
                    });
                }

                function getProgress(category) {
                    return category.totalQuestions > 0 ? Math.round(category.correct / category.totalQuestions * PERCENTAGE) : 0;
                }

                function getAvgTime(category) {
                    return category.totalQuestions > 0 ? Math.round(category.totalTime / category.totalQuestions / MILLISECOND) : 0;
                }
            }
        });
})(angular);
