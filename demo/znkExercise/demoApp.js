(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkExercise'])
        .config(function (QuestionTypesSrvProvider, $sceProvider) {
            $sceProvider.enabled(false);

            var map = {
                1: '<div>question Type 1</div><span>{{$parent.questionGetter().id}}</span>' +
                   '<div ng-bind-html="$parent.questionGetter().content"></div>' +
                   '<answer-builder></answer-builder>',
                2: '<div>question Type 2</div><span>{{$parent.questionGetter().id}}</span>',
                3: '<div>question Type 3</div><span>{{$parent.questionGetter().id}}</span>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);

            function questionTypeGetter(question) {
                return question.__type;
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);
        })
        .controller('Main', function ($scope, $timeout) {
            $scope.d = {};
            var id = 0;
            $scope.questions = [
                {
                    __type: 1,
                    id: ++id,
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
                    ],
                    correctAnswerId: 1,
                    content:
                        '<div style="padding-left: 517px;">' +
                            '<div>Header</div>' +
                            '<div>Content</div>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                            '<br>test<br>' +
                        '</div>'
                },
                {
                    __type: 1,
                    id: ++id,
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
                {
                    __type: 1,
                    id: ++id,
                    answerTypeId: 1,
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
                    ],
                    correctAnswerId: 1,
                    correctAnswerText: [{
                        content:'14/5'
                    },{
                        content:'2.8'
                    }]

                },
                {__type: 3, id: ++id},
                {__type: 1, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id},
                {__type: 2, id: ++id}
            ];

            $scope.settings = {
                viewMode: 1,
                allowedTimeForExercise: 10000,
                onQuestionAnswered: function () {

                },
                onDone: function () {
                    alert('On done was invoked');
                },
                initPagerDisplay: false,
                initForceDoneBtnDisplay: true
            };

            $scope.results = [{
                questionId: 1
            }, {
                questionId: 2
            }];
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

            $scope.removeQuestion = function () {
                $scope.questions.pop();
                $scope.results.pop();
                $scope.results = angular.copy($scope.results);
            };

            $scope.setSlideDirection = function (slideDirection) {
                $scope.d.actions.setSlideDirection(slideDirection);
            };

            $scope.setViewMode = function (viewMode) {
                $scope.settings.viewMode = viewMode;
                rebuildExercise();
            };

            function rebuildExercise() {
                $scope.hideExercise = true;
                $timeout(function () {
                    $scope.hideExercise = false;
                });
            }


            $scope.showOrHidePager = function () {
                $scope.settings.initPagerDisplay = !$scope.settings.initPagerDisplay;
                $scope.d.actions.pagerDisplay($scope.settings.initPagerDisplay);
            };

            $scope.showOrHideDoneBtn = function () {
                $scope.settings.initForceDoneBtnDisplay = !$scope.settings.initForceDoneBtnDisplay;
                $scope.d.actions.forceDoneBtnDisplay($scope.settings.initForceDoneBtnDisplay);
            };
        });
})(angular);
