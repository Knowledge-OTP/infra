(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "ACTIVE_PANEL":{
                        "SHOW_STUDENT_SCREEN": "Show Teacher Screen",
                        "SHOW_TEACHER_SCREEN": "Show Student Screen",
                        "SHARE_MY_SCREEN": "Share my screen"
                    }
                });
            });
})(angular);
