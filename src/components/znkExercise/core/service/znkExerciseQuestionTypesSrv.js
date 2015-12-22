(function (angular) {
    'use strict';
    angular.module('znk.infra.znkExercise').provider('ZnkExerciseQuestionTypesSrv', function QuestionTypesProvider() {
        var questionTypeToHtmlTemplateMap;
        this.setQuestionTypesHtmlTemplate = function (_questionTypeToHtmlTemplateMap) {
            questionTypeToHtmlTemplateMap = _questionTypeToHtmlTemplateMap;
        };

        this.$get = [
            function () {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(questionTypeId) {
                    return questionTypeToHtmlTemplateMap[questionTypeId];
                };

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);
