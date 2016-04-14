(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', [
            'znk.infra.enum',
            'znk.infra.svgIcon',
            'znk.infra.scroll',
            'znk.infra.autofocus',
            'ngAnimate'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    chevron: 'components/znkExercise/svg/chevron-icon.svg',
                    correct: 'components/znkExercise/svg/correct-icon.svg',
                    wrong: 'components/znkExercise/svg/wrong-icon.svg',
                    info: 'components/znkExercise/svg/info-icon.svg',
                    arrow: 'components/znkExercise/svg/arrow-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);
