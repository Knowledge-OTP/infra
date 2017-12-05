(function (angular) {
    'use strict';

    angular.module('znk.infra.stats', [
        'znk.infra.enum',
        'znk.infra.znkExercise',
        'znk.infra.utility',
        'znk.infra.contentGetters'
    ])
        .run(function (StatsEventsHandlerSrv) {
            'ngInject';
            StatsEventsHandlerSrv.init();
        });
})(angular);
