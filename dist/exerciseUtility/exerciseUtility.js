(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility', [
        'znk.infra.config',
        'znk.infra.enum',
        'znk.infra.storage',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail',
        'znk.infra.content'
    ]);
})(angular);

(function (angular) {
    'use strict';

    var answerTypeEnum = {
        SELECT_ANSWER: 0,
        FREE_TEXT_ANSWER: 1,
        RATE_ANSWER: 3
    };

    angular.module('znk.infra.exerciseUtility').constant('answerTypeEnumConst', answerTypeEnum);

    angular.module('znk.infra.exerciseUtility').factory('AnswerTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['SELECT_ANSWER', answerTypeEnum.SELECT_ANSWER, 'select answer'],
                ['FREE_TEXT_ANSWER', answerTypeEnum.FREE_TEXT_ANSWER, 'free text answer'],
                ['RATE_ANSWER', answerTypeEnum.RATE_ANSWER, 'rate answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('categoryEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['TUTORIAL', 1, 'tutorial'],
                ['EXERCISE', 2, 'exercise'],
                ['MINI_CHALLENGE', 3, 'miniChallenge'],
                ['SECTION', 4, 'section'],
                ['DRILL', 5, 'drill'],
                ['GENERAL', 6, 'general'],
                ['SPECIFIC', 7, 'specific'],
                ['STRATEGY', 8, 'strategy'],
                ['SUBJECT', 9, 'subject'],
                ['SUB_SCORE', 10, 'subScore'],
                ['TEST_SCORE', 11, 'testScore']
            ]);
        }
    ]);
})(angular);


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


(function (angular) {
    'use strict';
    var exerciseParentTypeConst = {
        WORKOUT: 1,
        TUTORIAL: 2,
        EXAM: 3,
        MODULE: 4
    };

    angular.module('znk.infra.exerciseUtility').factory('ExerciseParentEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['WORKOUT', 1, 'workout'],
                ['TUTORIAL', 2, 'tutorial'],
                ['EXAM', 3, 'exam'],
                ['MODULE', 4, 'module']
            ]);
        }
    ])
    .constant('exerciseParentTypeConst', exerciseParentTypeConst);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExerciseReviewStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['YES', 1, 'yes'],
                ['NO', 2, 'no'],
                ['DONE_TOGETHER', 3, 'done together']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseStatusEnum = {
        NEW: 0,
        ACTIVE: 1,
        COMPLETED: 2,
        COMING_SOON: 3
    };

    angular.module('znk.infra.exerciseUtility').constant('exerciseStatusConst', exerciseStatusEnum);

    angular.module('znk.infra.exerciseUtility').factory('ExerciseStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NEW', exerciseStatusEnum.NEW, 'new'],
                ['ACTIVE', exerciseStatusEnum.ACTIVE, 'active'],
                ['COMPLETED', exerciseStatusEnum.COMPLETED, 'completed'],
                ['COMING_SOON', exerciseStatusEnum.COMING_SOON, 'coming soon']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseTypeConst = {
        TUTORIAL: 1,
        PRACTICE: 2,
        GAME: 3,
        SECTION: 4,
        DRILL: 5,
        LECTURE: 13
    };

    angular.module('znk.infra.exerciseUtility')
        .constant('exerciseTypeConst', exerciseTypeConst)
        .factory('ExerciseTypeEnum', [
            'EnumSrv',
            function (EnumSrv) {
                return new EnumSrv.BaseEnum([
                    ['TUTORIAL', 1, 'Tutorial'],
                    ['PRACTICE', 2, 'Practice'],
                    ['GAME', 3, 'Game'],
                    ['SECTION', 4, 'Section'],
                    ['DRILL', 5, 'Drill'],
                    ['LECTURE', 13, 'Lecture']
                ]);
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    var LiveSessionSubject = {
        MATH: 1,
        ENGLISH: 2
    };

    angular.module('znk.infra.exerciseUtility').constant('LiveSessionSubjectConst', LiveSessionSubject);

    angular.module('znk.infra.exerciseUtility').factory('LiveSessionSubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['MATH', LiveSessionSubject.MATH, 'math-topic'],
                ['ENGLISH', LiveSessionSubject.ENGLISH, 'english-topic']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('QuestionFormatEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var QuestionFormatEnum = new EnumSrv.BaseEnum([
                ['TEXT',1,'text'],
                ['AUDIO',2, 'audio'],
                ['TEXT_AUDIO', 3, 'text audio'],
                ['PROSE_SUMMARY', 4, 'prose Summary'],
                ['FILL_IN_TABLE', 5, 'fill in a table'],
                ['CONNECTING_CONTENT', 6, 'connecting content'],
                ['INDEPENDENT', 7, 'independent'],
                ['STANDARD', 8, 'standard']
            ]);

            return QuestionFormatEnum;
        }
    ]);
})(angular);

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

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExerciseUtilitySrv',
        function () {
            'ngInject';
            
            var ExerciseUtilitySrv = {};

            return ExerciseUtilitySrv;
        }
    );
})(angular);

angular.module('znk.infra.exerciseUtility').run(['$templateCache', function($templateCache) {

}]);
