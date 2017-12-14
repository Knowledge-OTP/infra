(function (angular) {
    'use strict';

    var LiveSessionSubject = {
        MATH: 1,
        ENGLISH: 2,
        SCIENCE: 3
    };

    angular.module('znk.infra.exerciseUtility').constant('LiveSessionSubjectConst', LiveSessionSubject);

    angular.module('znk.infra.exerciseUtility').factory('LiveSessionSubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['MATH', LiveSessionSubject.MATH, 'math'],
                ['ENGLISH', LiveSessionSubject.ENGLISH, 'english'],
                ['SCIENCE', LiveSessionSubject.ENGLISH, 'science']
            ]);
        }
    ]);
})(angular);
