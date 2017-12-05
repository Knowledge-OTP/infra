(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore', [
            'znk.infra.config',
            'znk.infra.znkExercise',
            'znk.infra.contentGetters',
            'znk.infra.utility'
        ])
        .run(
            function (EstimatedScoreEventsHandlerSrv) {
                'ngInject';
                EstimatedScoreEventsHandlerSrv.init();
            });
})(angular);
