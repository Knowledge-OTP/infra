(function(angular) {
    'use strict';
    angular.module('demo', [
        'znk.infra.znkQuestionReport',
        'demoEnv'
        ])
        .controller('Main', function () {
            'ngInject';
            var vm = this;
            vm.questionData = {
                questionQUID: '123456789',
                exerciseID: '987654321',
                exerciseTypeID: '3',
                questionID: '65498'
            }
        });
})(angular);
