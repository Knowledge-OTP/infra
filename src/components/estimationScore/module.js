(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore', ['znk.infra.config','znk.infra.znkExercise'])
        .run([
            'EstimatedScoreEventsHandlerSrv',
            function(EstimatedScoreEventsHandlerSrv){
                EstimatedScoreEventsHandlerSrv.init();
            }
        ]);
})(angular);
