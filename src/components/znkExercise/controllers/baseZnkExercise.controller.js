(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('BaseZnkExerciseController',
        function ($scope, exerciseData, exerciseSettings, $state, ZnkExerciseDrvSrv, $q, ExerciseTypeEnum, $filter, $location, ScoringService, ExerciseResultSrv,
                  PopUpSrv, exerciseEventsConst, $rootScope, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum, SubjectEnum, znkAnalyticsSrv, StatsEventsHandlerSrv) {

            'ngInject';

            var exercise = exerciseData.exercise;
            var exerciseResult = exerciseData.exerciseResult;
            var exerciseTypeId = exerciseData.exerciseTypeId;
            var isSection = exerciseTypeId === ExerciseTypeEnum.SECTION.enum;

            var translateFilter = $filter('translate');
            var initSlideIndex;

            if (!$scope.baseZnkExerciseCtrl) {
                $scope.baseZnkExerciseCtrl = {};
            }

            if (exercise.subjectId === SubjectEnum.READING.enum) {     // adding passage title to reading questions
                var groupDataTypeTitle = {};
                var PASSAGE = translateFilter('ZNK_EXERCISE.PASSAGE');
                var groupDataCounter = 0;
                for (var j = 0; j < exercise.questions.length; j++) {
                    var groupDataId = exercise.questions[j].groupDataId;
                    if (angular.isUndefined(groupDataTypeTitle[groupDataId])) {
                        groupDataCounter++;
                        groupDataTypeTitle[groupDataId] = PASSAGE + groupDataCounter;
                    }
                    exercise.questions[j].passageTitle = groupDataTypeTitle[groupDataId];
                }
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

            function _calcSectionScoring() {
                if (!isSection) {
                    return $q.when(false);
                }
                var resultForScoring = {
                    subjectId: exerciseData.exercise.subjectId,
                    typeId: exerciseData.examData.typeId,
                    questions: exerciseData.exercise.questions,
                    answers: exerciseData.exerciseResult.questionResults.map(function (result) {
                        return {
                            userAnswerId: result.questionId,
                            isAnswerCorrectly: result.isAnsweredCorrectly,
                            afterAllowedTime: result.afterAllowedTime
                        };
                    })
                };
                return ScoringService.getScoreSectionResult(resultForScoring).then(function (scoreObj) {
                    return scoreObj.scoreSection;
                });
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
                            if (sectionResults.length === exam.sections.length - 1) {
                                innerProm = ScoringService.getScoreCompositeResult(sectionResults).then(function (score) {
                                    return score.compositeScoreResults;
                                });
                            }
                            return innerProm;
                        });
                    }
                }

                return prom;
            }


            function finishExercise() {
                _calcSectionScoring().then(function (scoreSection) {
                    exerciseResult.isComplete = true;
                    exerciseResult.endedTime = Date.now();
                    exerciseResult.categoryId = exerciseData.exercise.categoryId;
                    exerciseResult.subjectId = exerciseData.exercise.subjectId;
                    exerciseResult.exerciseName = exerciseData.headerTitlePrefix;
                    exerciseResult.exerciseOrder = exerciseData.workoutId;
                    exerciseResult.exerciseDescription = exerciseData.exerciseTypeId === ExerciseTypeEnum.SECTION.enum ? exerciseData.examData.name : exerciseData.exercise.name;
                    if (scoreSection) {
                        exerciseResult.score = scoreSection;
                    }
                    exerciseResult.$save();

                    var exerciseTypeValue = ExerciseTypeEnum.getValByEnum(exerciseData.exerciseTypeId);
                    exerciseTypeValue = exerciseTypeValue.toLowerCase();
                    var broadcastEventName = exerciseEventsConst[exerciseTypeValue].FINISH;

                    var exam = isSection ? exerciseData.examData : undefined;
                    $rootScope.$broadcast(broadcastEventName, exercise, exerciseResult, exam ? exam : null);
                    $scope.baseZnkExerciseCtrl.settings.viewMode = ZnkExerciseDrvSrv.viewModeEnum.review.enum;

                    _saveAnalytics();

                    var promsArr = [
                        _calcExamScoring(),
                        StatsEventsHandlerSrv.addNewExerciseResult(exerciseData.exerciseTypeId, exercise, exerciseResult)
                    ];

                    $q.all(promsArr).then(function (promsArrResult) {
                        var scoreExam = promsArrResult[0];
                        if (scoreExam) {
                            exerciseData.examResult.score = scoreExam;
                            exerciseData.examResult.$save();
                        }
                        $state.go('^.summary');
                    });
                });
            }

            function _getAllowedTimeForExercise() {
                var allowedTimeForQuestionByExercise = {
                    [ExerciseTypeEnum.TUTORIAL.enum]: 1.5 * 60 * 1000,
                    [ExerciseTypeEnum.DRILL.enum]: 40 * 1000
                };
                var allowedTimeForQuestion = allowedTimeForQuestionByExercise[exerciseTypeId];
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
