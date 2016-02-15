(function (angular) {
    'use strict';

    angular.module('testUtility').factory('TestUtilitySrv',
        function ($rootScope, $q, AnswerTypeEnum, $log) {
            var TestUtilitySrv = {};

            TestUtilitySrv.general = {};

            TestUtilitySrv.general.asyncToSync = function(fn,context){
                return function(){
                    var val;
                    $q.when(fn.apply(context||this ,arguments)).then(function(_val){
                        val = _val;
                    });
                    $rootScope.$digest();
                    return val;
                };
            };

            TestUtilitySrv.general.convertAllAsyncToSync = function(asyncActionsObj){
                var syncActionsObj = {};
                var keys = Object.keys(asyncActionsObj);
                keys.forEach(function(key){
                    if(angular.isFunction(asyncActionsObj[key])){
                        syncActionsObj[key] = TestUtilitySrv.general.asyncToSync(asyncActionsObj[key],asyncActionsObj);
                    }
                });
                return syncActionsObj;
            };

            TestUtilitySrv.general.printDebugLogs = function(){
                if(this.enabled){
                    return;
                }
                this.enable = true;
                function printLog(log,logType){
                    log.forEach(function(msg){
                        console[logType](msg);
                    });
                }
                var logsToPrint = ['debug','error'];
                logsToPrint.forEach(function(logType){
                    var currLogs = $log[logType].logs;
                    currLogs.forEach(function(log){
                        printLog(log,logType);
                    });
                    $log[logType] = function(){
                        var newLogs = [];
                        for(var i=0; i<arguments.length; i++){
                            newLogs.push(arguments[i]);
                        }
                        $log[logType].logs.push(newLogs);
                        printLog(newLogs,logType);
                    };
                    $log[logType].logs = currLogs;

                });
            };

            TestUtilitySrv.exercise = {};

            TestUtilitySrv.exercise.mockExerciseResult = function(exercise,numOfCorrectAnswers, numOfUnanswered, sequential){
                var questionsIndexArr = exercise.questions.map(function(item,index){
                    return index;
                });

                var correctAnswerMap = {},
                    i = 0;
                for(;numOfCorrectAnswers; --numOfCorrectAnswers){
                    var correctAnswerIndex = sequential ? 0 : Math.floor(Math.random() * questionsIndexArr.length);
                    correctAnswerMap[questionsIndexArr[correctAnswerIndex ]] = true;
                    questionsIndexArr.splice(correctAnswerIndex,1);
                }

                var result = {
                    duration: 0
                };
                result.questionResults = exercise.questions.map(function(question,index){
                    var questionResult = {
                        timeSpent: 0
                    };

                    if (!correctAnswerMap[index] && numOfUnanswered) {
                        numOfUnanswered--;
                        return questionResult;
                    }

                    switch(question.answerTypeId) {
                        case AnswerTypeEnum.SELECT_ANSWER.enum:
                            questionResult.userAnswer = correctAnswerMap[index] ? question.correctAnswerId : question.correctAnswerId + 1;
                            break;
                        case AnswerTypeEnum.FREE_TEXT_ANSWER.enum:
                            questionResult.userAnswer = correctAnswerMap[index] ? question.correctAnswerText[0].content : question.correctAnswerText[0].content + 1;
                            break;
                    }

                    questionResult.isAnsweredCorrectly = !!correctAnswerMap[index];

                    return questionResult;
                });

                return result;
            };

            return TestUtilitySrv;
        }
    );
})(angular);
