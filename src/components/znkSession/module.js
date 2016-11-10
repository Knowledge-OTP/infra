(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession',
        [
            'ngMaterial',
            'znk.infra.popUp',
            'pascalprecht.translate',
            'znk.infra.auth',
            'znk.infra.userContext',
            'znk.infra.utility',
            'znk.infra.analytics',
            'znk.infra.general',
            'znk.infra.user',
            'znk.infra.svgIcon',
            'znk.infra.mailSender',
            'znk.infra.exerciseUtility',
            'znk.infra.calls',
            'znk.infra.activePanel'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znkSession-english-icon': 'components/znkSession/svg/znkSession-verbal-icon.svg',
                    'znkSession-math-icon': 'components/znkSession/svg/znkSession-math-icon.svg',
                    'znkSession-start-lesson-popup-icon': 'components/znkSession/svg/znkSession-start-lesson-popup-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);
