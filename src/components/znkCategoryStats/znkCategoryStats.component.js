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
                var categoryKey = StatsSrv.getCategoryKey(vm.categoryId);

                buildUiCategory(categoryKey);

                StatsSrv.getStatsByCategoryId(vm.categoryId).then(function (categoryStats) {

                });

                function buildUiCategory(categoryId) {
                    var dataPromMap = {};
                    dataPromMap.stats = StatsSrv.getStatsByCategoryId(vm.categoryId);
                    dataPromMap.category = CategoryService.getCategoryData(categoryId);

                    $q.all(dataPromMap).then(function (data) {
                        var userStats = data.stats;
                        var category = data.category;

                        var extendObj = {};
                        extendObj.progress = getProgress(categoryStats);
                        extendObj.avgTime = getAvgTime(categoryStats);

                        vm.category = angular.extend(categoryStats, extendObj);



                        if (category && !vm.generalCategories[category.id] && userStats[LEVEL2_CATEGORIES_STATS]['id_' + category.id]) {
                            var categoryObj = userStats[LEVEL2_CATEGORIES_STATS]['id_' + category.id];

                            vm.generalCategories[category.id] = {};
                            vm.generalCategories[category.id].shortName = category.shortName;
                            vm.generalCategories[category.id].name = category.name;
                            vm.generalCategories[category.id].progress = getProgress(categoryObj);
                            vm.generalCategories[category.id].avgTime = getAvgTime(categoryObj);
                        }
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
