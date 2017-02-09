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
                vm.generalCategories = {};
                var userStats = {};
                var GENERAL_CATEGORIES_STATS = 'level2Categories'; // property name of stats object in database

                var statsProm = StatsSrv.getStats();

                statsProm.then(function (statsData) {
                    userStats = statsData;
                    buildGeneralCategory(vm.categoryId);
                });


                function buildGeneralCategory(categoryId) {
                    CategoryService.getParentCategory(categoryId).then(function (generalCategory) {
                        if (generalCategory && !vm.generalCategories[generalCategory.id] && userStats[GENERAL_CATEGORIES_STATS]['id_' + generalCategory.id]) {
                            var generalCategoryObj = userStats[GENERAL_CATEGORIES_STATS]['id_' + generalCategory.id];
                            var progress = getProgress(generalCategoryObj);

                            vm.generalCategories[generalCategory.id] = {};
                            vm.generalCategories[generalCategory.id].name = generalCategory.name;
                            vm.generalCategories[generalCategory.id].progress = progress;
                        }
                    });
                }

                function getProgress(generalCategoryObj) {
                    return generalCategoryObj.totalQuestions > 0 ? Math.round((generalCategoryObj.correct * PERCENTAGE) / generalCategoryObj.totalQuestions) : 0;
                }

            }
        });


})(angular);
