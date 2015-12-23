(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkExercise'])
        .config(function(QuestionTypesSrvProvider){
            var map = {
                1: '<div>question Type 1</div>',
                2: '<div>question Type 2</div>',
                3: '<div>question Type 3</div>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);

            function questionTypeGetter(question){
                return question.__type;
            }
            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);
        });
})(angular);