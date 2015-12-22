(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', ['znk.infra.enum', 'znk.infra.svgIcon'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    chevron: 'components/znkExercise/svg/chevron-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);