(function (angular) {
    'use strict';

    var exerciseEventsConst = {};

    exerciseEventsConst.tutorial = {
        FINISH: 'tutorial:finish'
    };

    exerciseEventsConst.drill = {
        FINISH: 'drill:finish'
    };

    exerciseEventsConst.practice = {
        FINISH: 'practice:finish'
    };

    exerciseEventsConst.game = {
        FINISH: 'game:finish'
    };

    exerciseEventsConst.section = {
        FINISH: 'section:finish'
    };

    exerciseEventsConst.daily = {
        STATUS_CHANGED: 'daily:status'
    };

    exerciseEventsConst.exam = {
        COMPLETE: 'exam:complete'
    };

    angular.module('znk.infra.znkExercise').constant('exerciseEventsConst', exerciseEventsConst);
})(angular);
