(function(angular) {
    'use strict';
    angular.module('demo', [
        'demoEnv',
        'pascalprecht.translate',
        'znk.infra.znkLesson'
        ])
        .decorator('ENV', function ($delegate) {
            'ngInject';
            $delegate.lessonExtendTime = 15;  // in minutes
            return $delegate;
        })
        .controller('Main', function () {
            'ngInject';
            var vm = this;

        });
})(angular);
