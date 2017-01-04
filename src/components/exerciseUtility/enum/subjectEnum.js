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
        ESSAY: 8,
        MATHLVL1: 9,
        MATHLVL2: 10
    };

    angular.module('znk.infra.exerciseUtility').constant('SubjectEnumConst', subjectEnum);

    angular.module('znk.infra.exerciseUtility').factory('SubjectEnum', [
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
                ['ESSAY', subjectEnum.ESSAY, 'essay'],
                ['MATHLVL1', subjectEnum.MATHLVL1, 'mathlvl1'],
                ['MATHLVL2', subjectEnum.MATHLVL2, 'mathlvl2']
            ]);

            return SubjectEnum;
        }
    ]);
})(angular);
