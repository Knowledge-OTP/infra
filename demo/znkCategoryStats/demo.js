(function(angular) {

    angular.module('demo', [
        'demoEnv',
        'znk.infra.znkCategoryStats',
        'pascalprecht.translate',
        'znk.infra.exerciseUtility'
    ])
    .config(function () {
            'ngInject';

            localStorage.setItem('email','ofir+actStu11@zinkerz.com');
            localStorage.setItem('password','123123');
            localStorage.setItem('dataDbPath','https://act-dev.firebaseio.com/');
            localStorage.setItem('studentPath','/act_app');
            localStorage.setItem('teacherPath','/act_dashboard');
    })
    .controller('Main', function (SubjectEnum) {
        'ngInject';
        var vm = this;

        vm.categoryId = SubjectEnum.MATH.enum;
    });
})(angular);
