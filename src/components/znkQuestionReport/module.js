(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport',
        [
            'ngMaterial',
            'znk.infra.popUp',
            'pascalprecht.translate',
            'znk.infra.auth',
            'znk.infra.analytics',
            'znk.infra.general',
            'znk.infra.user',
            'znk.infra.svgIcon',
            'znk.infra.mailSender',
            'znk.infra.exerciseUtility'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'close-popup': 'components/znkQuestionReport/svg/close-popup.svg',
                    'report-question-icon': 'components/znkQuestionReport/svg/report-question-icon.svg',
                    'completed-v-report-icon': 'components/znkQuestionReport/svg/completed-v-report.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);
