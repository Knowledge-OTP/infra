(function (angular) {
    'use strict';

    angular.module('demo',[
            'znk.infra.znkExercise',
            'znk.infra.content',
            'ui.router',
            'angulartics',
            'znk.infra.stats',
            'pascalprecht.translate',
            'znk.infra.analytics',
            'znk.infra.popUp',
            'demoEnv'
        ])
        .config(function ($translateProvider) {
            'ngInject';
            $translateProvider.preferredLanguage('en');
            $translateProvider.useSanitizeValueStrategy(null);
        })
        .controller('Main', function ($scope, $timeout, ContentSrv, ZnkExerciseUtilitySrv, ExerciseResultSrv, $controller ) {

            var resultsData;

            var self = this;

            this.showExercise = true;

            function setExercise(exerciseName, exerciseId) {
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
                        self.results = results;

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

            function rebuildExercise() {
                $scope.hideExercise = true;
                $timeout(function () {
                    $scope.hideExercise = false;
                });
            }

            $scope.d = {};

            $scope.settings = {
                viewMode: 2,
                allowedTimeForExercise: 10000,
                onDone: function () {
                    alert('On done was invoked');
                },
                initForceDoneBtnDisplay: true,
                toolBox: {
                    drawing:{
                        exerciseDrawingPathPrefix: 'dummy-prefix',
                        toucheColorId: 1
                    }
                }
            };

            $scope.setSlideDirection = function (slideDirection) {
                $scope.d.actions.setSlideDirection(slideDirection);
            };

            $scope.setViewMode = function (viewMode) {
                $scope.settings.viewMode = viewMode;
                rebuildExercise();
            };

            this.rebuildExercise = function(){
                self.showExercise = false;
                $timeout(function(){
                    self.showExercise = true;
                });
            };

            this.updateCurrentAnswer = function(newAnswer){
                var currSlideIndex = $scope.d.actions.getCurrentIndex();
                var currentQuestionAnswer = $scope.results[currSlideIndex];
                currentQuestionAnswer.userAnswer = newAnswer;
            };

            this.togglePagerDisplay = function(){
                var newState = !$scope.d.actions.getPagerDisplayState();
                $scope.d.actions.pagerDisplay(newState);
            };

            setExercise('practice', '165');
        });
})(angular);
