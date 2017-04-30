(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExerciseReviewStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['YES', 1, 'yes'],
                ['NO', 2, 'no'],
                ['DONE_TOGETHER', 3, 'done together']
            ]);
        }
    ]);
})(angular);
