(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp', ['znk.infra.svgIcon', 'znk.infra.autofocus'])
        .config(function (SvgIconSrvProvider) {
            'ngInject';
                var svgMap = {
                    'popup-exclamation-mark': 'components/popUp/svg/exclamation-mark-icon.svg',
                    'popup-correct': 'components/popUp/svg/correct-icon.svg',
                    'popup-info-icon': 'components/popUp/svg/info-message-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            });
})(angular);
