(function(angular) {
    'use strict';
    angular.module('demo', [
        'znk.infra.znkQuestionReport'
        ])
        .config(function ($translateProvider) {
            'ngInject';
            $translateProvider.preferredLanguage('en');
            $translateProvider.useSanitizeValueStrategy(null);
        })
        .controller('Main', function () {
            'ngInject';
            var vm = this;
            vm.questionData = {
                questionID: '11035',
                questionQUID: 'V-RC-00-00-SCI-RH-PURP-0000-0000-GENE-SC-MC-2-11035',
                exerciseID: '165',
                exerciseTypeID: '2'
            }
        });
})(angular);
