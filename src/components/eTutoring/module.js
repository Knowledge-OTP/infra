(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring',[
        'znk.infra.contentGetters'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'homework-icon': 'components/eTutoring/svg/homework-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);
