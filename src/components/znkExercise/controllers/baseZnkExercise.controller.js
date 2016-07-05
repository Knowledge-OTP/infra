(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('BaseZnkExerciseController',
        function ($scope, exerciseData, exerciseSettings, $state, $q, ExerciseTypeEnum, $location, ExerciseResultSrv, ZnkExerciseSrv, $filter,
                  PopUpSrv, exerciseEventsConst, $rootScope, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum, SubjectEnum, znkAnalyticsSrv, $translatePartialLoader) {
            'ngInject';
            $translatePartialLoader.addPart('znkExercise');

            var exercise = exerciseData.exercise;
            var exerciseResult = exerciseData.exerciseResult;
            var exerciseTypeId = exerciseData.exerciseTypeId;
            var isSection = exerciseTypeId === ExerciseTypeEnum.SECTION.enum;

            var translateFilter = $filter('translate');
            var t = translateFilter('ZNK_EXERCISE.SOME_ANSWER_LEFT_CONTENT');
            debugger;
            var initSlideIndex;

            if (!$scope.baseZnkExerciseCtrl) {
                $scope.baseZnkExerciseCtrl = {};
            }

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

            function _saveAnalytics() {
                if (isSection) {
                    znkAnalyticsSrv.eventTrack({
                        eventName: 'sectionCompleted',
                        questionsArr: exerciseResult.questionResults,
                        props: {
                            testId: exerciseData.examData.id,
                            exerciseType: exerciseResult.exerciseTypeId,
                            subjectType: exercise.subjectId,
                            sectionId: exerciseResult.exerciseId,
                            name: exercise.name
                        }
                    });
                } else {
                    znkAnalyticsSrv.eventTrack({
                        eventName: 'workoutCompleted',
                        questionsArr: exerciseResult.questionResults,
                        props: {
                            timeBundle: exercise.userTimePreference,
                            typeId: exercise.typeId,
                            exerciseType: exerciseResult.exerciseTypeId,
                            subjectType: exercise.subjectId,
                            exerciseId: exerciseResult.exerciseId
                        }
                    });
                }
            }

            function _calcExamScoring() {
                var prom = $q.when(false);
                var examResult, exam;
                var scoreResultsArr;
                var examResultsProms;
                if (!isSection) {
                    return prom;
                }

                examResult = exerciseData.examResult;
                exam = exerciseData.examData;
                scoreResultsArr = (examResult) ? Object.keys(examResult.sectionResults) : [];
                // if there no 4 section results, return false
                if (scoreResultsArr.length >= exam.sections.length - 1) {
                    if (!examResult.score) {
                        examResultsProms = [];

                        angular.forEach(scoreResultsArr, function (sectionResultKey) {
                            var sectionResultKeyNum = +sectionResultKey;
                            if (exerciseResult.exerciseId !== sectionResultKeyNum) {
                                var sectionProm = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionResultKeyNum,
                                    exerciseData.examData.id, exerciseData.examData.sections.length);
                                examResultsProms.push(sectionProm);
                            }
                        });

                        return $q.all(examResultsProms).then(function (sections) {
                            var sectionResults = [];
                            var innerProm = false;
                            angular.forEach(sections, function (section) {
                                if (section.score && section.subjectId !== SubjectEnum.WRITING.enum) {
                                    sectionResults.push(section.score);
                                }
                            });
                            if (exerciseResult.score && exerciseResult.subjectId !== SubjectEnum.WRITING.enum) {
                                sectionResults.push(exerciseResult.score);
                            }
                            // if there's score on 4 sections except WRITING
                            // if (sectionResults.length === exam.sections.length - 1) {
                            //     innerProm = ScoringService.getScoreCompositeResult(sectionResults).then(function (score) {
                            //         return score.compositeScoreResults;
                            //     });
                            // }
                            return innerProm;
                        });
                    }
                }

                return prom;
            }

            function _getAllowedTimeForExercise() {
                var allowedTimeMapByExercise = ZnkExerciseSrv.getAllowedTimeForQuestionByExercise();
                var allowedTimeForQuestion = allowedTimeMapByExercise[exerciseTypeId];
                if (angular.isDefined(allowedTimeForQuestion)) {
                    return allowedTimeForQuestion * exercise.questions.length;
                }
                return exercise.time;
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
            }

            var defExerciseSettings = {
                onDone: function onDone() {
                    var numOfUnansweredQuestions = getNumOfUnansweredQuestions(exerciseResult.questionResults);
                    var areAllQuestionsAnsweredProm = $q.when(true);
                    if (numOfUnansweredQuestions) {
                        var content = translateFilter('ZNK_EXERCISE.SOME_ANSWER_LEFT_CONTENT');
                        var title = translateFilter('ZNK_EXERCISE.FINISH_TITLE');
                        var buttonGoTo = translateFilter('ZNK_EXERCISE.GO_TO_SUMMARY_BTN');
                        var buttonStay = translateFilter('ZNK_EXERCISE.STAY_BTN');
                        areAllQuestionsAnsweredProm = PopUpSrv.warning(title, content, buttonGoTo, buttonStay).promise;
                    }
                    areAllQuestionsAnsweredProm.then(function () {
                        finishExercise(exerciseResult);
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
                var content = translateFilter('ZNK_EXERCISE.TIME_UP_CONTENT');
                var title = translateFilter('ZNK_EXERCISE.TIME_UP_TITLE');
                var buttonFinish = translateFilter('ZNK_EXERCISE.STOP');
                var buttonContinue = translateFilter('ZNK_EXERCISE.CONTINUE_BTN');
                var timeOverPopupPromise = PopUpSrv.ErrorConfirmation(title, content, buttonFinish, buttonContinue).promise;

                timeOverPopupPromise.then(function () {
                    finishExercise();
                });
            };

            $scope.baseZnkExerciseCtrl.onChangeTime = function (passedTime) {
                exerciseResult.duration = passedTime;
            };
        })

})(angular);
