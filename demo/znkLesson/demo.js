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

            $delegate.activeLesson = {
                eessonLength: 55,    // in minutes
                lessonExtendTime: 15, // in minutes
                lessonEndAlertTime: 5 // in minutes
            };
            $delegate.appContext = "dashboard";
            $delegate.studentAppName = "sat_app";
            return $delegate;
        })
        .controller('Main', function (LessonSrv) {
            'ngInject';
            var vm = this;
            vm.showActiveLessonModal = LessonSrv.showActiveLessonModal;

        });
})(angular);
