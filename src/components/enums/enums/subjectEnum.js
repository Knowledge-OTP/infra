(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        READING: 1,
        WRITING: 2,
        LISTENING: 3,
        SPEAKING: 4,
        ENGLISH: 5,
        SCIENCE: 6,
        VERBAL: 7,
        ESSAY: 8
    };

    angular.module('znk.infra.enum').constant('SubjectEnumConst', subjectEnum);

    angular.module('znk.infra.enum').factory('SubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var SubjectEnum = new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['READING', subjectEnum.READING, 'reading'],
                ['WRITING', subjectEnum.WRITING, 'writing'],
                ['LISTENING', subjectEnum.LISTENING, 'listening'],
                ['SPEAKING', subjectEnum.SPEAKING, 'speaking'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english'],
                ['SCIENCE', subjectEnum.SCIENCE, 'science'],
                ['VERBAL', subjectEnum.VERBAL, 'verbal'],
                ['ESSAY', subjectEnum.ESSAY, 'essay']
            ]);

            return SubjectEnum;
        }
    ]);
})(angular);
