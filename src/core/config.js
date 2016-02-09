(function (angular) {
    'use strict';

    angular.module('znk.infra', [
        'znk.infra.config',
        'znk.infra.pngSequence',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'znk.infra.general',
        'znk.infra.scroll',
        'znk.infra.content',
        'znk.infra.znkExercise',
        'znk.infra.storage',
        'znk.infra.utility',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail',
        'znk.infra.popUp',
        'znk.infra.estimatedScore'
    ]);
})(angular);
