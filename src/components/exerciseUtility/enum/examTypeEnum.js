(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExamTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['FULL_TEST', 0, 'test'],
                ['MINI_TEST', 1, 'miniTest'],
                ['DIAGNOSTIC', 2, 'diagnostic']
            ]);
        }
    ]);
})(angular);

