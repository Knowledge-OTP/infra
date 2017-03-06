(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'etutoring-exercise-icon': 'components/eTutoring/svg/etutoring-exercise-icon.svg',
                'etutoring-slides-icon': 'components/eTutoring/svg/etutoring-slides-icon.svg',
                'etutoring-calendar-icon': 'components/eTutoring/svg/etutoring-calendar-icon.svg',
                'etutoring-close-icon': 'components/eTutoring/svg/etutoring-close-popup.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);
