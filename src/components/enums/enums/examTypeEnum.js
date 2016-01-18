(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('ExamTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['FULL TEST', 0, 'test'],
                ['MINI TEST', 1, 'miniTest']]);
        }
    ]);
})(angular);

