(function (angular) {
    'use strict';
    angular.module('znk.infra.znkExercise').provider('QuestionTypesSrv', function QuestionTypesProvider() {
        var questionTypeToHtmlTemplateMap = {};
        this.setQuestionTypesHtmlTemplate = function (_questionTypeToHtmlTemplateMap) {
            questionTypeToHtmlTemplateMap = _questionTypeToHtmlTemplateMap;
        };

        var questionTypeGetterFn = angular.noop;
        this.setQuestionTypeGetter = function(typeGetterFn){
            questionTypeGetterFn = typeGetterFn;
        };

        var answersFormaterObjMap = {};        
        this.setAnswersFormatValidtors = function (_answersFormaterObjMap) {
            answersFormaterObjMap = _answersFormaterObjMap;
        };

        this.$get = [
            '$log','$q',
            function ($log, $q) {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(question) {
                    return $q.when(questionTypeGetterFn(question)).then(function(questionType){
                        var questionTypeId = questionType;
                        if(!questionTypeToHtmlTemplateMap[questionTypeId]){
                            $log.error('QuestionTypesSrv: Template was not registered for the following question type:',questionTypeId);
                        }
                        return questionTypeToHtmlTemplateMap[questionTypeId];
                    });
                };

                QuestionTypesSrv.getQuestionType = function getQuestionType(question) {
                    return questionTypeGetterFn(question);
                };

                QuestionTypesSrv.checkAnswerAgainstFormatValidtors = function (userAnswer, questionFormatId, callbackValidAnswer, callbackUnValidAnswer) {   
                    if (!angular.isFunction(callbackValidAnswer)) { // callbackUnValidAnswer is optional
                        $log.error('QuestionTypesSrv checkAnswerAgainstFormatValidtors: callbackValidAnswer are missing!');
                        return;
                    }

                   var answersFormaterArr = answersFormaterObjMap[questionFormatId];

                    // if there's no userAnswer or formatters or it's not an array then invoke callbackValidAnswer                    
                   if (!userAnswer ||
                       !angular.isArray(answersFormaterArr) ||
                       !answersFormaterArr.length) {
                        callbackValidAnswer();
                        return;
                    }

                    var answersFormaterArrLength = answersFormaterArr.length;

                    var answerValueBool, currentFormatter;                     
                    for (var i = 0; i < answersFormaterArrLength; i++) {
                        currentFormatter = answersFormaterArr[i];

                        if (angular.isFunction(currentFormatter)) {
                            answerValueBool = currentFormatter(userAnswer);
                        }

                        if (currentFormatter instanceof RegExp) { // currentFormatter should be a regex pattren
                           answerValueBool = currentFormatter.test(userAnswer);
                        }

                        // break loop if userAnswer is a valid answer
                        if (typeof answerValueBool === "boolean" && answerValueBool) {
                            callbackValidAnswer();
                            break;
                        }
                        // if last iteration, then answer is un valid, invoke callbackUnValidAnswer if exist
                        if (i === answersFormaterArrLength - 1) {
                            if (callbackUnValidAnswer) {
                                callbackUnValidAnswer();
                            }
                        }
                    }
                };

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);
