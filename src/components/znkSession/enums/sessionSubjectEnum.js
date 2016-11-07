(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        ENGLISH: 5
    };

    angular.module('znk.infra.znkSession').constant('SessionSubjectEnumConst', subjectEnum);

    angular.module('znk.infra.znkSession').factory('SessionSubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {

            return new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english']
            ]);
        }
    ]);
})(angular);
