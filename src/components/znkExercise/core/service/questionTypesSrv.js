(function (angular) {
    'use strict';
    angular.module('znk.infra.znkExercise').provider('QuestionTypesSrv', function QuestionTypesProvider() {
        var questionTypeToHtmlTemplateMap = {};
        this.setQuestionTypesHtmlTemplate = function (_questionTypeToHtmlTemplateMap) {
            questionTypeToHtmlTemplateMap = _questionTypeToHtmlTemplateMap;
        };

        this.$get = [
            '$log',
            function ($log) {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(questionTypeId) {
                    if(!questionTypeToHtmlTemplateMap[questionTypeId]){
                        $log.error('QuestionTypesSrv: Template was not registered for the following question type:',questionTypeId)
                    }
                    return questionTypeToHtmlTemplateMap[questionTypeId];
                };

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);
