(function (angular) {
    'use strict';

    var exerciseTypeConst = {
        TUTORIAL: 1,
        PRACTICE: 2,
        GAME: 3,
        SECTION: 4,
        DRILL: 5,
        LECTURE: 13
    };

    angular.module('znk.infra.exerciseUtility')
        .constant('exerciseTypeConst', exerciseTypeConst)
        .factory('ExerciseTypeEnum', [
            'EnumSrv',
            function (EnumSrv) {
                return new EnumSrv.BaseEnum([
                    ['TUTORIAL', 1, 'Tutorial'],
                    ['PRACTICE', 2, 'Practice'],
                    ['GAME', 3, 'Game'],
                    ['SECTION', 4, 'Section'],
                    ['DRILL', 5, 'Drill'],
                    ['LECTURE', 13, 'Lecture']
                ]);
            }
        ]);
})(angular);
