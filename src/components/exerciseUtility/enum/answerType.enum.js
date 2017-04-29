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

