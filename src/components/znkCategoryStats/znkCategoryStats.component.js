(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats')
        .component('znkCategoryStats', {
            bindings: {
                categoryId: '=',
                subjectId: '='
            },
            templateUrl: 'components/znkCategoryStats/znkCategoryStats.template.html',
            controllerAs: 'vm',
            controller: function (StatsSrv, CategoryService) {
                'ngInject';
                var vm = this;
                var PERCENTAGE = 100;
                var MILLISECOND = 1000;
                vm.generalCategories = {};
                var userStats = {};
                    var LEVEL2_CATEGORIES_STATS = 'level2Categories'; // property name of stats object in database

                var statsProm = StatsSrv.getStats();

                statsProm.then(function (statsData) {
                    userStats = statsData;
                    buildGeneralCategory(vm.categoryId);
                });


                function buildGeneralCategory(categoryId) {
                    CategoryService.getParentCategory(categoryId).then(function (level2Category) {
                        if (level2Category && !vm.generalCategories[level2Category.id] && userStats[LEVEL2_CATEGORIES_STATS]['id_' + level2Category.id]) {
                            var level2CategoryObj = userStats[LEVEL2_CATEGORIES_STATS]['id_' + level2Category.id];

                            vm.generalCategories[level2Category.id] = {};
                            vm.generalCategories[level2Category.id].shortName = level2Category.shortName;
                            vm.generalCategories[level2Category.id].name = level2Category.name;
                            vm.generalCategories[level2Category.id].masteryLevel = level2Category.masteryLevel;
                            vm.generalCategories[level2Category.id].progress = getProgress(level2CategoryObj);
                            vm.generalCategories[level2Category.id].avgTime = getAvgTime(level2CategoryObj);
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
