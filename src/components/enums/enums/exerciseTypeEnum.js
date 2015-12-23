(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('ExerciseTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['TUTORIAL', 1, 'Tutorial'],
                ['PRACTICE', 2, 'Practice'],
                ['GAME', 3, 'Game'],
                ['SECTION', 4, 'Section'],
                ['DRILL', 5, 'Drill']
            ]);
        }
    ]);
})(angular);
