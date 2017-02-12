(function(angular) {

    angular.module('demo', [
        'demoEnv',
        'znk.infra.znkCategoryStats',
        'pascalprecht.translate',
        'znk.infra.exerciseUtility'
    ])
    .decorator('CategoryService', function ($delegate, $q) {
        'ngInject';

        $delegate.getCategoryData = function (categoryId) {
            return $q.when({
                    "correct" : 15,
                    "id" : 0,
                    "totalQuestions" : 43,
                    "totalTime" : 842353,
                    "unanswered" : 0,
                    "wrong" : 28
                });
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

        vm.categoryId = SubjectEnum.MATH.enum;
    });
})(angular);
