(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkExercise'])
        .config(function(QuestionTypesSrvProvider){
            var map = {
                1: '<div>question Type 1</div><span>{{$parent.questionGetter().id}}</span>',
                2: '<div>question Type 2</div><span>{{$parent.questionGetter().id}}</span>',
                3: '<div>question Type 3</div><span>{{$parent.questionGetter().id}}</span>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);

            function questionTypeGetter(question){
                return question.__type;
            }
            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);
        });
})(angular);