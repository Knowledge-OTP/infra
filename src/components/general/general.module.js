(function (angular) {
    'use strict';

    angular.module('znk.infra.general',
        [
            'znk.infra.enum',
            'znk.infra.svgIcon',
            'pascalprecht.translate',
            'angular-svg-round-progressbar'
        ])
        .config( function (SvgIconSrvProvider) {
            'ngInject';
            var svgMap = {
                'general-clock-icon': 'components/general/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });

})(angular);
