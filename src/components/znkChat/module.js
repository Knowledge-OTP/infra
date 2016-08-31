(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat',
        [
            'znk.infra.svgIcon',
            'znk.infra.teachers'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znk-chat-chat-icon': 'components/znkChat/svg/znk-chat-chat-icon.svg',
                    'znk-chat-close-icon': 'components/znkChat/svg/znk-chat-close-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);
