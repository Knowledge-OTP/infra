(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('BaseZnkExerciseController',
        function ($scope, exerciseData, exerciseSettings, $state, $q, ExerciseTypeEnum, $location, ExerciseResultSrv, ZnkExerciseSrv,
                  $filter, PopUpSrv, exerciseEventsConst, $rootScope, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum, SubjectEnum,
                  znkAnalyticsSrv, $translate, $log, StatsEventsHandlerSrv) {
            'ngInject';

            var exercise = exerciseData.exercise;
            var exerciseResult = exerciseData.exerciseResult;
            var exerciseTypeId = exerciseData.exerciseTypeId;
            var isSection = exerciseTypeId === ExerciseTypeEnum.SECTION.enum;
            var initSlideIndex;

            function getNumOfUnansweredQuestions(questionsResults) {
                var numOfUnansweredQuestions = questionsResults.length;
                var keysArr = Object.keys(questionsResults);
                angular.forEach(keysArr, function (i) {
                    var questionAnswer = questionsResults[i];
                    if (angular.isDefined(questionAnswer.userAnswer)) {
                        numOfUnansweredQuestions--;
                    }
                });
                return numOfUnansweredQuestions;
            }

            function _getAllowedTimeForExercise() {
                if (exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                    return exercise.time;
                }

                var allowedTimeForQuestion = ZnkExerciseSrv.getAllowedTimeForQuestion(exerciseTypeId);
                return allowedTimeForQuestion * exercise.questions.length;
            }

            function _finishExercise() {
                exerciseResult.isComplete = true;
                exerciseResult.endedTime = Date.now();
                exerciseResult.$save();

                //  stats exercise data
                StatsEventsHandlerSrv.addNewExerciseResult(exerciseTypeId, exercise, exerciseResult).then(function () {
                    $scope.baseZnkExerciseCtrl.settings.viewMode = ZnkExerciseViewModeEnum.REVIEW.enum;

                    var exerciseTypeValue = ExerciseTypeEnum.getValByEnum(exerciseData.exerciseTypeId).toLowerCase();
                    var broadcastEventName = exerciseEventsConst[exerciseTypeValue].FINISH;
                    $rootScope.$broadcast(broadcastEventName, exercise, exerciseResult, exerciseData.examData);

                    $state.go('^.summary');
                });
            }

            if (!$scope.baseZnkExerciseCtrl) {
                $scope.baseZnkExerciseCtrl = {};
            }

            if (angular.isUndefined(exerciseResult.startedTime)) {
                exerciseResult.startedTime = Date.now();
            }

            exerciseData.exercise.questions = exerciseData.exercise.questions.sort(function (a, b) {
                return a.order - b.order;
            });

            if (!angular.isArray(exerciseResult.questionResults) || exerciseResult.questionResults.length === 0) {
                exerciseResult.questionResults = exercise.questions.map(function (question) {
                    return {
                        questionId: question.id,
                        categoryId: question.categoryId
                    };
                });
            }

            ZnkExerciseUtilitySrv.setQuestionsGroupData(exercise.questions, exercise.questionsGroupData);

            $scope.baseZnkExerciseCtrl.exercise = exercise;
            $scope.baseZnkExerciseCtrl.resultsData = exerciseResult;
            $scope.baseZnkExerciseCtrl.numberOfQuestions = $scope.baseZnkExerciseCtrl.exercise.questions.length;

            var viewMode;
            if (exerciseResult.isComplete) {
                viewMode = ZnkExerciseViewModeEnum.REVIEW.enum;
                initSlideIndex = 0;
            } else {
                viewMode = isSection ? ZnkExerciseViewModeEnum.ONLY_ANSWER.enum : ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                initSlideIndex = exerciseResult.questionResults.findIndex(function (question) {
                    return !question.userAnswer;
                });

                if (initSlideIndex === -1) {
                    initSlideIndex = 0;
                }
            }

            var defExerciseSettings = {
                onDone: function onDone() {
                    var numOfUnansweredQuestions = getNumOfUnansweredQuestions(exerciseResult.questionResults);

                    var areAllQuestionsAnsweredProm = $q.when(true);
                    if (numOfUnansweredQuestions) {
                        var contentProm = $translate('ZNK_EXERCISE.SOME_ANSWER_LEFT_CONTENT');
                        var titleProm = $translate('ZNK_EXERCISE.FINISH_TITLE');
                        var buttonGoToProm = $translate('ZNK_EXERCISE.GO_TO_SUMMARY_BTN');
                        var buttonStayProm = $translate('ZNK_EXERCISE.STAY_BTN');

                        areAllQuestionsAnsweredProm = $q.all([contentProm, titleProm, buttonGoToProm, buttonStayProm]).then(function (results) {
                            var content = results[0];
                            var title = results[1];
                            var buttonGoTo = results[2];
                            var buttonStay = results[3];
                            return PopUpSrv.warning(title, content, buttonGoTo, buttonStay).promise;
                        }, function (err) {
                            $log.error(err);
                        });
                    }
                    areAllQuestionsAnsweredProm.then(function () {
                        _finishExercise(exerciseResult);
                    });
                },
                onQuestionAnswered: function onQuestionAnswered() {
                    exerciseResult.$save();
                },
                onSlideChange: function (currQuestion, currentIndex) {
                    var indexPlusOne = currentIndex + 1;
                    znkAnalyticsSrv.pageTrack({
                        props: {
                            url: $location.url() + '/index/' + indexPlusOne + '/questionId/' + (currQuestion.id || '')
                        }
                    });
                    $scope.baseZnkExerciseCtrl.currentIndex = indexPlusOne;
                },
                viewMode: viewMode,
                initSlideIndex: initSlideIndex || 0,
                allowedTimeForExercise: _getAllowedTimeForExercise()
            };

            $scope.baseZnkExerciseCtrl.settings = angular.extend(defExerciseSettings, exerciseSettings);
            $scope.baseZnkExerciseCtrl.settings.onExerciseReady = function () {
                if (exerciseSettings.onExerciseReady) {
                    exerciseSettings.onExerciseReady();
                }
            };

            $scope.baseZnkExerciseCtrl.startTime = exerciseResult.duration || 0;
            $scope.baseZnkExerciseCtrl.maxTime = exercise.time;

            $scope.baseZnkExerciseCtrl.timerData = {
                timeLeft: exercise.time - (exerciseResult.duration || 0),
                config: {
                    countDown: true
                }
            };

            $scope.baseZnkExerciseCtrl.onFinishTime = function () {
                var contentProm = $translate('ZNK_EXERCISE.TIME_UP_CONTENT');
                var titleProm = $translate('ZNK_EXERCISE.TIME_UP_TITLE');
                var buttonFinishProm = $translate('ZNK_EXERCISE.STOP');
                var buttonContinueProm = $translate('ZNK_EXERCISE.CONTINUE_BTN');

                $q.all([contentProm, titleProm, buttonFinishProm, buttonContinueProm]).then(function (results) {
                    var content = results[0];
                    var title = results[1];
                    var buttonFinish = results[2];
                    var buttonContinue = results[3];
                    var timeOverPopupPromise = PopUpSrv.ErrorConfirmation(title, content, buttonFinish, buttonContinue).promise;

                    timeOverPopupPromise.then(function () {
                        _finishExercise(exerciseResult);
                    });
                });
            };

            $scope.baseZnkExerciseCtrl.onChangeTime = function (passedTime) {
                exerciseResult.duration = passedTime;
            };
        });

})(angular);
