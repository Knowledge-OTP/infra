(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats')
        .component('znkCategoryStats', {
            bindings: {
                categoryId: '='
            },
            templateUrl: 'components/znkCategoryStats/znkCategoryStats.template.html',
            controllerAs: 'vm',
            controller: function (StatsSrv, CategoryService) {
                'ngInject';
                var vm = this;
                var PERCENTAGE = 100;
                var MILLISECOND = 1000;

                this.$onInit = function() {
                    buildUiCategory(vm.categoryId);
                };

                function buildUiCategory(categoryId) {
                    var statsProm = StatsSrv.getStatsByCategoryId(categoryId);
                    vm.category = CategoryService.getCategoryDataSync(categoryId);
                    vm.level1CategoryId = CategoryService.getCategoryLevel1ParentByIdSync(categoryId);

                    statsProm.then(function (categoryStats) {
                        var extendObj = {};
                        extendObj.progress = getProgress(categoryStats);
                        extendObj.avgTime = getAvgTime(categoryStats);

                        vm.category = angular.extend(vm.category, extendObj);
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
