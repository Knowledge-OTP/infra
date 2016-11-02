(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson',
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
                    'znkLesson-close-popup': 'components/znkLesson/svg/znkLesson-close-popup.svg',
                    'znkLesson-english-icon': 'components/znkLesson/svg/znkLesson-verbal-icon.svg',
                    'znkLesson-math-icon': 'components/znkLesson/svg/znkLesson-math-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);
