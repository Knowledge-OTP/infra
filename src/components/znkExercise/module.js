(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', [
        'ngAnimate',
        'pascalprecht.translate',
        'znk.infra.znkQuestionReport',
        'znk.infra.svgIcon',
        'znk.infra.scroll',
        'znk.infra.autofocus',
        'znk.infra.exerciseUtility',
        'znk.infra.analytics',
        'znk.infra.popUp',
        'znk.infra.user',
        'znk.infra.utility'
    ])
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'znk-exercise-chevron': 'components/znkExercise/svg/chevron-icon.svg',
                'znk-exercise-eraser': 'components/znkExercise/svg/tools-eraser.svg',
                'znk-exercise-pencil': 'components/znkExercise/svg/tools-pencil.svg',
                'znk-exercise-pointer': 'components/znkExercise/svg/tools-pointer.svg',
                'znk-exercise-remove': 'components/znkExercise/svg/tools-remove.svg',
                'znk-exercise-touche': 'components/znkExercise/svg/tools-touche.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);
