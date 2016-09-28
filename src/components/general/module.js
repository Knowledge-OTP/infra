(function (angular) {
    'use strict';

    angular.module('znk.infra.general', ['znk.infra.enum', 'znk.infra.svgIcon', 'angular-svg-round-progress'])
        .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'general-clock-icon': 'components/general/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);

})(angular);
