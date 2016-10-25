(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer', [
        'pascalprecht.translate',
        'znk.infra.svgIcon'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znk-audio-player-play': 'components/znkAudioPlayer/svg/play-icon.svg',
                    'znk-audio-player-pause': 'components/znkAudioPlayer/svg/pause-icon.svg',
                    'znk-audio-player-close': 'components/znkAudioPlayer/svg/close-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);
