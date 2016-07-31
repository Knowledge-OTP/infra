(function (angular) {
    'use strict';

    angular.module('demo',
        ['znk.infra.znkExercise',
            'znk.infra.content',
            'ui.router',
            'angulartics',
            'znk.infra.stats',
            'pascalprecht.translate',
            'znk.infra.analytics',
            'znk.infra.popUp'])
        .config(function (QuestionTypesSrvProvider, $sceProvider, ZnkExerciseSrvProvider, exerciseTypeConst, $translateProvider, $translatePartialLoaderProvider) {
            $sceProvider.enabled(false);


            var allowedTimeForQuestionByExercise = {};
            allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
            ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);

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

            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/{part}/locale/{lang}.json'
            });
            $translateProvider.preferredLanguage('en');
            $translatePartialLoaderProvider.addPart('znkExercise');
        })

        .controller('Main', function ($scope, $timeout, ContentSrv, ZnkExerciseUtilitySrv, ExerciseResultSrv, $controller ) {

            var resultsData;

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

            setExercise('practice', '165');
        })
        .run(function ($rootScope, $translate) {
            $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
                $translate.refresh();
            })
        });

})(angular);
