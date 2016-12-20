(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession',
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
                    'liveSession-english-icon': 'components/liveSession/svg/liveSession-verbal-icon.svg',
                    'liveSession-math-icon': 'components/liveSession/svg/liveSession-math-icon.svg',
                    'liveSession-start-lesson-popup-icon': 'components/liveSession/svg/liveSession-start-lesson-popup-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);
