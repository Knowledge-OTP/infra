(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp', ['znk.infra.svgIcon'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'exclamation-mark': 'components/popUp/svg/exclamation-mark-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);
