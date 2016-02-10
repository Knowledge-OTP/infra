(function (angular) {
    'use strict';

    angular.module('znk.infra.stats', ['znk.infra.enum','znk.infra.znkExercise'])
        .run([
            'StatsEventsHandlerSrv',
            function(StatsEventsHandlerSrv){
                StatsEventsHandlerSrv.init();
            }
        ]);
})(angular);
