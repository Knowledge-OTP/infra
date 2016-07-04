(function (angular) {
    'use strict';

    angular.module('demo',
        ['znk.infra.znkExercise',
            'znk.infra.content',
            'ui.router',
            'angulartics',
            'znk.infra.stats',
            'znk.infra.analytics',
            'znk.infra.popUp'])
        .config(function (QuestionTypesSrvProvider, $sceProvider) {
            $sceProvider.enabled(false);

            var map = {
                1: '<div>question Type 1</div><span>{{$parent.questionGetter().id}}</span>' +
                   '<div ng-bind-html="$parent.questionGetter().content"></div>' +
                   '<answer-builder></answer-builder>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);

            function questionTypeGetter() {
                return '1';
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);
        })

        .controller('Main', function ($scope, $timeout, ContentSrv, ZnkExerciseUtilitySrv, ExerciseResultSrv, $controller) {

            var resultsData;

            function setExercise(exerciseName, exerciseId, settings) {
                /**
                 add this params to local storage for content {key, value}
                 znkAuthToken   UTuQGrDsSazNNJrnGTTmDlvGzztZe8E0zbo0A4kw
                 znkData       https://znk-toefl-dev.firebaseio.com/
                 znkStudentPath      /toefl_app
                 */
                ContentSrv.getContent({
                    exerciseType: exerciseName,
                    exerciseId: exerciseId
                }).then(function (exerciseJson) {
                    var exercise = angular.fromJson(exerciseJson);
                    ZnkExerciseUtilitySrv.setQuestionsGroupData(exercise.questions, exercise.questionsGroupData);

                    var examId = angular.isDefined(exercise.examId) ? exercise.examId : null;
                    var exerciseType = angular.isDefined(exercise.examId) ? 4 : +exercise.parentTypeId;

                    ExerciseResultSrv.getExerciseResult(exerciseType, +exercise.id, examId).then(function (results) {
                        resultsData = results;
                        $scope.questions = exercise.questions;
                        if (results.questionResults.length === 0) {
                            results.questionResults = exercise.questions.map(function (question) {
                                return {questionId: question.id};
                            });
                            results.$save();
                        }
                        $scope.results = results.questionResults;
                        $scope.subjectId = exercise.subjectId;
                        $scope.questionReady = true;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }

                        var exerciseData = {
                            exercise: exercise,
                            exerciseResult : results,
                            exerciseTypeId: exerciseType
                        };

                        $controller('BaseZnkExerciseController', {
                            $scope: $scope,
                            exerciseData: exerciseData,
                            exerciseSettings: $scope.settings
                        });
                    });
                });
            }

            setExercise('practice', '165');


            $scope.d = {};

            $scope.settings = {
                viewMode: 2,
                allowedTimeForExercise: 10000,
                onDone: function () {
                    alert('On done was invoked');
                },
                initPagerDisplay: false,
                initForceDoneBtnDisplay: true
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
        })

})(angular);
