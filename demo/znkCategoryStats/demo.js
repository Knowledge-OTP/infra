(function(angular) {

    angular.module('demo', [
        'demoEnv',
        'categories.mock',
        'znk.infra.znkCategoryStats',
        'pascalprecht.translate',
        'znk.infra.exerciseUtility'
    ])
    .decorator('CategoryService', function ($delegate, $q) {
        'ngInject';

        $delegate.getCategoryData = function (categoryId) {
            return $q.when({"id":9,"name":"Math Level 1","shortName":"M1","parentId":null,"typeId":9,"instruction":null,"weight":null,"subScore1Id":null,"subScore2Id":null});
        };
        return $delegate;
    })
    .decorator('StatsSrv', function ($delegate, $q) {
        'ngInject';

        $delegate.getStatsByCategoryId = function () {
            return $q.when({
                    "correct" : 15,
                    "id" : 0,
                    "totalQuestions" : 43,
                    "totalTime" : 842353,
                    "unanswered" : 0,
                    "wrong" : 28
                }
            );
        };
        return $delegate;
    })
    .controller('Main', function (SubjectEnum) {
        'ngInject';
        var vm = this;

        vm.categoryId = SubjectEnum.MATHLVL1.enum;
        // vm.categoryId = 29;
    });
})(angular);
