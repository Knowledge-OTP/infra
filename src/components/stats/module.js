(function (angular) {
    'use strict';

    angular.module('znk.infra.stats', [
            'znk.infra.enum',
            'znk.infra.znkExercise',
            'znk.infra.utility'
        ])
        .run([
            'StatsEventsHandlerSrv',
            function (StatsEventsHandlerSrv) {
                StatsEventsHandlerSrv.init();
            }
        ]);
})(angular);
