(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('categoryEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['TUTORIAL', 1, 'tutorial'],
                ['EXERCISE', 2, 'exercise'],
                ['MINI_CHALLENGE', 3, 'miniChallenge'],
                ['SECTION', 4, 'section'],
                ['DRILL', 5, 'drill'],
                ['GENERAL', 6, 'general'],
                ['SPECIFIC', 7, 'specific'],
                ['STRATEGY', 8, 'strategy'],
                ['SUBJECT', 9, 'subject'],
                ['SUB_SCORE', 10, 'subScore'],
                ['TEST_SCORE', 11, 'testScore'],
                ['LEVEL1', 101, 'level1Categories'],
                ['LEVEL2', 102, 'level2Categories'],
                ['LEVEL3', 103, 'level3Categories'],
                ['LEVEL4', 104, 'level4Categories']
            ]);
        }
    ]);
})(angular);

