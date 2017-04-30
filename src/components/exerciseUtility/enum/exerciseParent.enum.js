(function (angular) {
    'use strict';
    var exerciseParentTypeConst = {
        WORKOUT: 1,
        TUTORIAL: 2,
        EXAM: 3,
        MODULE: 4
    };

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
    ])
    .constant('exerciseParentTypeConst', exerciseParentTypeConst);

})(angular);
