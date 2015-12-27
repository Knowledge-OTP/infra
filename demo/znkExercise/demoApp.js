(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkExercise'])
        .config(function(QuestionTypesSrvProvider){
            var map = {
                1: '<div>question Type 1</div><span>{{$parent.questionGetter().id}}</span><answer-builder></answer-builder>',
                2: '<div>question Type 2</div><span>{{$parent.questionGetter().id}}</span>',
                3: '<div>question Type 3</div><span>{{$parent.questionGetter().id}}</span>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);

            function questionTypeGetter(question){
                return question.__type;
            }
            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);
        })
        .controller('Main',function($scope){
            $scope.questions = [
                {__type: 1, id:1, answerTypeId: 0, answers:[
                    {
                        id:1,
                        content: '<span>answer1</span>'
                    },
                    {
                        id:2,
                        content: '<span>answer2</span>'
                    },
                    {
                        id:3,
                        content: '<span>answer3</span>'
                    }
                ]},
                {__type: 2,id:2},
                {__type: 3,id:3},
                {__type: 1,id:4},
                {__type: 2,id:5}
            ];

            $scope.settings = {
                viewMode: 2
            };
        });
})(angular);
