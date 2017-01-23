(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule',
        ['znk.infra.znkModule',
            'znk.infra.exerciseResult',
            'znk.infra.userContext',
            'pascalprecht.translate',
            'znk.infra.popUp'])
        .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'homework-exclamation-mark-icon': 'components/assignModule/svg/homework-exclamation-mark-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);
