(function(angular) {

    angular.module('demo', [
        'demoEnv',
        'znk.infra.znkCategoryStats',
        'pascalprecht.translate',
        'znk.infra.exerciseUtility'
    ])
    .controller('Main', function (SubjectEnum) {
        'ngInject';
        var vm = this;

        vm.categoryId = SubjectEnum.MATH.enum;
    });
})(angular);
