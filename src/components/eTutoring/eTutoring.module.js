(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring',[
        'znk.infra.contentGetters'
    ])
        .config(function (SvgIconSrvProvider) {
                'ngInject';
                var svgMap = {
                    'homework-icon': 'components/eTutoring/svg/homework-icon.svg',
                    'english-topic-icon': 'components/eTutoring/svg/english-topic-icon.svg',
                    'math-topic-icon': 'components/eTutoring/svg/math-topic-icon.svg',
                    'etutoring-slides-icon': 'components/eTutoring/svg/etutoring-slides-icon.svg',
                    'etutoring-exercise-icon': 'components/eTutoring/svg/etutoring-exercise-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            });
})(angular);
