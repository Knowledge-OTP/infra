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
            'znk.infra.mailSender'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'close-popup': 'components/znkQuestionReport/svg/close-popup.svg',
                    'report-icon': 'components/znkQuestionReport/svg/report-flag.svg',
                    'completed-v-report-icon': 'components/znkQuestionReport/svg/completed-v-report.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);
