(function(angular) {

    angular.module('demo', [
        'demoEnv',
        'znk.infra.znkCategoryStats',
        'pascalprecht.translate',
        'znk.infra.exerciseUtility'
    ])
    .decorator('CategoryService', function ($delegate, $q) {
        'ngInject';

        $delegate.getParentCategory = function (categoryId) {
            return $q.when({
                id:11,
                name:'Algebra and Functions',
                shortName:'AF1',
                parentId:9,
                typeId:6,
                instruction:null,
                weight:null,
                subScore1Id:null
                ,subScore2Id:null
            });
        };
        return $delegate;
    })
    .decorator('StatsSrv', function ($delegate, $q) {
        'ngInject';

        $delegate.getStats = function () {
            return $q.when({"level1Categories":{"id_9":{"correct":3,"id":9,"totalQuestions":10,"totalTime":185656,"unanswered":3,"wrong":4}},"level2Categories":{"id_11":{"correct":1,"id":11,"parentsIds":[9],"totalQuestions":3,"totalTime":9167,"unanswered":0,"wrong":2},"id_15":{"correct":2,"id":15,"parentsIds":[9],"totalQuestions":4,"totalTime":173035,"unanswered":0,"wrong":2},"id_16":{"correct":0,"id":16,"parentsIds":[9],"totalQuestions":3,"totalTime":3454,"unanswered":3,"wrong":0}},"level3Categories":{"id_28":{"correct":1,"id":28,"parentsIds":[11,9],"totalQuestions":3,"totalTime":9167,"unanswered":0,"wrong":2},"id_48":{"correct":2,"id":48,"parentsIds":[15,9],"totalQuestions":4,"totalTime":173035,"unanswered":0,"wrong":2},"id_58":{"correct":0,"id":58,"parentsIds":[16,9],"totalQuestions":3,"totalTime":3454,"unanswered":3,"wrong":0}},"processedExercises":{"1_217":true,"1_222":true,"1_225":true}});
        };
        return $delegate;
    })
    .controller('Main', function (SubjectEnum) {
        'ngInject';
        var vm = this;

        vm.subjectId = SubjectEnum.MATHLVL1.enum;
        vm.categoryId = 48;
    });
})(angular);
