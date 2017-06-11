(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats')
        .component('znkCategoryStats', {
            bindings: {
                categoryId: '='
            },
            templateUrl: 'components/znkCategoryStats/components/znkCategoryStats.template.html',
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
                        if (!categoryStats){
                            categoryStats = 0;
                        }
                        var extendObj = {};
                        extendObj.progress = getProgress(categoryStats);
                        extendObj.avgTime = getAvgTime(categoryStats);

                        vm.category = angular.extend(vm.category, extendObj);

                        vm.category.specificArray = [{"id":"34","name":"Direct and inverse variation","levelProgress":0,"correct":0,"wrong":1,"totalQuestions":1},{"id":"43","name":"Qualitative Behavior of Functions","levelProgress":43,"correct":3,"wrong":4,"totalQuestions":7},{"id":"46","name":"Ratios and Proportions","levelProgress":25,"correct":2,"wrong":1,"totalQuestions":8},{"id":"50","name":"Mean/Median/Mode","levelProgress":18,"correct":3,"wrong":14,"totalQuestions":17},{"id":"51","name":"Complex Data interpretation","levelProgress":0,"correct":0,"wrong":5,"totalQuestions":6},{"id":"52","name":"Simple Data interpretation","levelProgress":14,"correct":4,"wrong":25,"totalQuestions":29},{"id":"58","name":"Percents","levelProgress":25,"correct":1,"wrong":2,"totalQuestions":4},{"id":"59","name":"Probability","levelProgress":0,"correct":0,"wrong":5,"totalQuestions":5},{"id":"60","name":"Statistical analysis, standard deviation","levelProgress":0,"correct":0,"wrong":3,"totalQuestions":3},{"id":"61","name":"Two-Way Tables","levelProgress":38,"correct":3,"wrong":5,"totalQuestions":8},{"id":"62","name":"Unit Conversion","levelProgress":17,"correct":1,"wrong":4,"totalQuestions":6}];
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
