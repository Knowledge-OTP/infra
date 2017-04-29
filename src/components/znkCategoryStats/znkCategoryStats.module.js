(function (angular) {
    'use strict';

    angular.module('znk.infra.znkCategoryStats', [
        'ngMaterial',
        'pascalprecht.translate',
        'znk.infra.znkProgressBar',
        'znk.infra.stats',
        'znk.infra.contentGetters',
        'znk.infra.general',
        'znk.infra.svgIcon',
        'znk.infra.znkTooltip'
    ])
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            'ngInject';
            var svgMap = {
                'znkCategoryStats-clock-icon': 'components/znkCategoryStats/svg/clock-icon.svg',
                'znkCategoryStats-v-icon': 'components/znkCategoryStats/svg/v-icon.svg',
                'znkCategoryStats-x-icon': 'components/znkCategoryStats/svg/x-icon.svg',
                'znkCategoryStats-total-icon': 'components/znkCategoryStats/svg/total-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }
    ]);
})(angular);
