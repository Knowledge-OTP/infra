(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkExercise'])
        .config(function (QuestionTypesSrvProvider) {
            var map = {
                1: '<div>question Type 1</div><span>{{$parent.questionGetter().id}}</span><answer-builder></answer-builder>',
                2: '<div>question Type 2</div><span>{{$parent.questionGetter().id}}</span>',
                3: '<div>question Type 3</div><span>{{$parent.questionGetter().id}}</span>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);

            function questionTypeGetter(question) {
                return question.__type;
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);
        })
        .controller('Main', function ($scope) {
            $scope.questions = [
                {
                    __type: 1, id: 1, answerTypeId: 0, answers: [
                    {
                        id: 1,
                        content: '<span>answer1</span>'
                    },
                    {
                        id: 2,
                        content: '<span>answer2</span>'
                    },
                    {
                        id: 3,
                        content: '<span>answer3</span>'
                    }
                ]
                },
                {
                    __type: 1,
                    id: 1,
                    answerTypeId: 3,
                    correctAnswerText: [
                        {
                            id: 4

                        },
                        {
                            id: 5

                        },
                        {
                            id: 6

                        }
                    ]
                },
                {__type: 3, id: 3},
                {__type: 1, id: 4},
                {__type: 2, id: 5}
            ];

            $scope.settings = {
                viewMode: 1,
                onQuestionAnswered: function(){

                },
                onDone: function(){
                    alert('On done was invoked');
                },
                initPagerDisplay: true
            };
            $scope.results = [];
            $scope.addQuestion = function () {
                $scope.results.push({});
                $scope.results = angular.copy($scope.results);

                $scope.questions.push({
                    __type: 1,
                    id: $scope.questions.length + 1,
                    answerTypeId: 0,
                    answers: [
                        {
                            id: 1,
                            content: '<span>answer1</span>'
                        },
                        {
                            id: 2,
                            content: '<span>answer2</span>'
                        },
                        {
                            id: 3,
                            content: '<span>answer3</span>'
                        }
                    ]
                });
            };

            $scope.removeQuestion = function(){
                $scope.questions.pop();
                $scope.results.pop();
                $scope.results = angular.copy($scope.results);
            };

            $scope.setSlideDirection = function(slideDirection){
                $scope.actions.setSlideDirection(slideDirection);
            };


            $scope.showOrHidePager= function(){
                $scope.settings.initPagerDisplay = !$scope.settings.initPagerDisplay;
                $scope.actions.pagerDisplay($scope.settings.initPagerDisplay);
            };
        });
})(angular);
