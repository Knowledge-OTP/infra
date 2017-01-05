(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('LiveSessionSubjectEnum', [
        'EnumSrv',
        function (EnumSrv, subjectEnum) {
            return new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH.enum, 'math'],
                ['ENGLISH', subjectEnum.ENGLISH.enum, 'english']
            ]);
        }
    ]);
})(angular);
