(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('LiveSessionSubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['MATH', 1, 'math'],
                ['ENGLISH', 2, 'english']
            ]);
        }
    ]);
})(angular);
