(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats', [
        'ngMaterial',
        'pascalprecht.translate',
        'znk.infra.znkProgressBar',
        'znk.infra.stats',
        'znk.infra.contentGetters',
        'znk.infra.general',
        'znk.infra.svgIcon'
    ])
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            'ngInject';
            var svgMap = {
                'znkCategoryStats-clock-icon': 'components/znkCategoryStats/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }
    ]);
})(angular);
