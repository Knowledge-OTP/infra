(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', [
        'ngAnimate',
        'pascalprecht.translate',
        'znk.infra.svgIcon',
        'znk.infra.scroll',
        'znk.infra.autofocus',
        'znk.infra.exerciseUtility',
        'znk.infra.analytics',
        'znk.infra.popUp'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znk-exercise-chevron': 'components/znkExercise/svg/chevron-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }])
        .run(function ($translatePartialLoader) {
            'ngInject';

            $translatePartialLoader.addPart('znkExercise');
        });
})(angular);
