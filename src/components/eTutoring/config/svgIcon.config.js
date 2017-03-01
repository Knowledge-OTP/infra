(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'etutoring-exercise-icon': 'components/eTutoring/svg/etutoring-exercise-icon.svg',
                'etutoring-slides-icon': 'components/eTutoring/svg/etutoring-slides-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);
