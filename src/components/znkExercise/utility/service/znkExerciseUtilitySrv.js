(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseUtilitySrv', ['AnswerTypeEnum',
        function (AnswerTypeEnum) {
            var ZnkExerciseUtilitySrv = {};
            //@todo(igor) move to utility service
            ZnkExerciseUtilitySrv.bindFunctions = function(dest,src,functionToCopy){
                functionToCopy.forEach(function(fnName){
                    dest[fnName] = src[fnName].bind(src);
                });
            };

            var answersIdsMap;
            ZnkExerciseUtilitySrv.isAnswerCorrect = function isAnswerCorrect(question, userAnswer) {
                var isCorrect, answer;
                switch (question.answerTypeId) {
                    case AnswerTypeEnum.SELECT_ANSWER.enum:
                        answer = '' + userAnswer;
                        isCorrect = ('' + question.correctAnswerId) === answer;
                        break;
                    case AnswerTypeEnum.FREE_TEXT_ANSWER.enum:
                        answer = '' + userAnswer;
                         answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                            return '' + answerMap.content;
                        });
                        isCorrect = answersIdsMap.indexOf(answer) !== -1;
                        break;
                    case AnswerTypeEnum.RATE_ANSWER.enum:
                        answer = '' + userAnswer;
                         answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                            return '' + answerMap.id;
                        });
                        isCorrect = answersIdsMap.indexOf(answer) !== -1;
                        break;
                }

                return !!isCorrect;
            };
            return ZnkExerciseUtilitySrv;
        }
    ]);
})(angular);
