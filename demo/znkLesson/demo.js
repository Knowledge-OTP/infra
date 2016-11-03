(function(angular) {
    'use strict';
    angular.module('demo', [
        'demoEnv',
        'pascalprecht.translate',
        'znk.infra.znkLesson'
        ])
        .config(function(LessonSrvProvider) {
           LessonSrvProvider.setSubjects( [0, 5] );

        })
        .decorator('ENV', function ($delegate) {
            'ngInject';
            $delegate.lessonExtendTime = 15;  // in minutes
            $delegate.appContext = "dashboard";
            $delegate.studentAppName = "sat_app";
            return $delegate;
        })
        .controller('Main', function () {
            'ngInject';
            var vm = this;

        });
})(angular);
