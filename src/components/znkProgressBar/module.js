(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar', [
        'znk.infra.svgIcon',
        'pascalprecht.translate'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {};
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }])
})(angular);
