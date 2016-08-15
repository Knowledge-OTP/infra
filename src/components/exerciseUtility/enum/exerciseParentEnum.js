(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExerciseParentEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['WORKOUT', 1, 'workout'],
                ['TUTORIAL', 2, 'tutorial'],
                ['EXAM', 3, 'exam'],
                ['MODULE', 4, 'module']
            ]);
        }
    ]);
})(angular);
