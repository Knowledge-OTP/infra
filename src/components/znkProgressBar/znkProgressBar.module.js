(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar', [
        'znk.infra.svgIcon',
        'pascalprecht.translate'
    ])
        .config(function (SvgIconSrvProvider) {
            'ngInject';
                var svgMap = {};
                SvgIconSrvProvider.registerSvgSources(svgMap);
            });
})(angular);
