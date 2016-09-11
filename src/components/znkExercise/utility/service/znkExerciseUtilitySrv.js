(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseUtilitySrv', function () {

            // default true for all
            var broadCastExerciseFn = function() {
                return true;
            };

            this.setShouldBroadCastExerciseGetter = function(_broadCastExerciseFn) {
                broadCastExerciseFn = _broadCastExerciseFn;
            };

            this.$get = function(AnswerTypeEnum, $log, $q, $injector) {
                'ngInject';

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

                ZnkExerciseUtilitySrv.setQuestionsGroupData = function (questions, groupData) {
                    var groupDataMap = {};

                    angular.forEach(groupData, function (group) {
                        groupDataMap[group.id] = group;
                    });

                    angular.forEach(questions, function (question) {
                        if (question.groupDataId && !groupDataMap[question.groupDataId]) {
                            $log.debug('Group data is missing for the following question id ' + question.id);
                        }

                        question.groupData = groupDataMap[question.groupDataId] || {};
                    });
                };

                ZnkExerciseUtilitySrv.shouldBroadCastExercise = function() {
                    return function(shouldBroadCastObj) {
                        try {
                            return $q.when($injector.invoke(broadCastExerciseFn.bind(null, shouldBroadCastObj)));
                        } catch (e) {
                            $log.error('ZnkExerciseUtilitySrv shouldBroadCastExercise: failed in invoke broadCastExerciseFn');
                            return $q.reject(e);
                        }
                    };
                };

                return ZnkExerciseUtilitySrv;
            };
        }
    );
})(angular);
