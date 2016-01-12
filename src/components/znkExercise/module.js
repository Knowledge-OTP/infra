(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', ['znk.infra.enum', 'znk.infra.svgIcon', 'znk.infra.scroll'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    chevron: 'components/znkExercise/svg/chevron-icon.svg',
                    correct: 'components/znkExercise/svg/correct-icon.svg',
                    wrong: 'components/znkExercise/svg/wrong-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);
