(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar', [
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }])
        .run(function ($translatePartialLoader) {
            'ngInject';
            $translatePartialLoader.addPart('znkProgressBar');
        });
})(angular);
