(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExamTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['FULL TEST', 0, 'test'],
                ['MINI TEST', 1, 'miniTest'],
                ['DIAGNOSTIC', 2, 'diagnostic']
            ]);
        }
    ]);
})(angular);

