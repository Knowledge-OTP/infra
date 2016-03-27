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

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);
