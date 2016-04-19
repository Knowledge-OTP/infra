(function (angular) {
    'use strict';

    angular.module('znk.infra.autofocus', ['znk.infra.enum', 'znk.infra.svgIcon'])
        .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'clock-icon': 'components/general/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);

})(angular);
