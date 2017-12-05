(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        ENGLISH: 5
    };

    angular.module('znk.infra.znkSessionData').constant('SessionSubjectEnumConst', subjectEnum);

    angular.module('znk.infra.znkSessionData').factory('SessionSubjectEnum',
        function (EnumSrv) {
            'ngInject';
            return new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english']
            ]);
        });
})(angular);
