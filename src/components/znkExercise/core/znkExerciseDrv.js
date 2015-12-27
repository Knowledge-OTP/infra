/**
 * attrs:
 *  questions: questions array
 *  ngModel: results array
 *  settings:
 *      onDone
 *      onQuestionAnswered
 *      wrapperCls
 *      toolsToHide
 *      viewMode
 *      onExerciseReady
 *      onSlideChange
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercise', [
        'ZnkExerciseSrv', '$location', /*'$analytics',*/ '$window', '$q', 'ZnkExerciseEvents', 'PlatformEnum', '$log', 'ZnkExerciseViewModeEnum',
        function (ZnkExerciseSrv, $location, /*$analytics, */$window, $q, ZnkExerciseEvents, PlatformEnum, $log, ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExerciseDrv.html',
                restrict: 'E',
                transclude: true,
                controllerAs: 'vm',
                require: ['znkExercise', 'ngModel'],
                scope: {
                    questionsGetter: '&questions',
                    settings: '=?',
                    actions: '=?'
                },
                controller: 'ZnkExerciseDrvCtrl',
                compile: function (element) {
                    var platform = ZnkExerciseSrv.getPlatform();
                    if (!platform) {
                        $log.$error('znkExercise directive: undefined platform received.');
                    }
                    var PlatformEnumMap = PlatformEnum.getEnumMap();
                    element.addClass(PlatformEnumMap[platform]);

                    return {
                        pre: function (scope, element, attrs, ctrls) {
                            var defaultSettings = {
                                onDone: angular.noop,
                                onQuestionAnswered: angular.noop,
                                viewMode: ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                                onSlideChange: angular.noop
                            };
                            scope.settings = angular.extend(defaultSettings, scope.settings);

                            var znkExerciseDrvCtrl = ctrls[0];
                            var ngModelCtrl = ctrls[1];

                            var questionAnswersToOneObjectfmtr = {},
                                allQuestionWithAnswersArr,
                                isMobile = $window.innerWidth <= 567;

                            var questionAnswered;

                            scope.d = {
                                answeredCount: 0,
                                slideDirections: ZnkExerciseSrv.slideDirections
                            };
                            znkExerciseDrvCtrl.setCurrentIndex(scope.settings.initSlideIndex || 0);

                            scope.actions = scope.actions || {};
                            scope.actions.setSlideIndex = function setSlideIndex(index) {
                                znkExerciseDrvCtrl.setCurrentIndex(index);
                            };
                            scope.actions.getCurrentIndex = function () {
                                return znkExerciseDrvCtrl.getCurrentIndex();
                            };
                            scope.actions.finishExercise = function () {
                                updateTimeSpentOnQuestion();
                                setViewValue();
                            };

                            function getCurrentQuestion() {
                                return allQuestionWithAnswersArr[scope.d.currentSlide];
                            }

                            var toolboxModalSettings = {
                                toolsToHide: scope.settings.toolsToHide,
                                wrapperCls: scope.settings.toolBoxWrapperClass || ''
                            };
                            toolboxModalSettings.events = {
                                onToolOpened: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BLACKBOARD, currQuestion.__questionStatus.blackboardData || {});
                                            if (isMobile) {
                                                scope.d.hidePager = true;
                                            }
                                            break;
                                    }
                                },
                                onToolClosed: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            currQuestion.__questionStatus.blackboardData = evt.value;
                                            if (isMobile) {
                                                scope.d.hidePager = false;
                                            }
                                            break;
                                    }
                                    setViewValue();
                                },
                                onToolValueChanged: function (evt) {
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BOOKMARK:
                                            scope.d.bookmarkCurrentQuestion();
                                            break;
                                    }
                                    setViewValue();
                                }
                            };
                            var toolBoxModalInstance = ZnkExerciseSrv.openExerciseToolBoxModal(toolboxModalSettings);

                            function setViewValue() {
                                ngModelCtrl.$setViewValue(angular.copy(scope.d.questionsWithAnswers));
                            }

                            function render(viewValue) {
                                allQuestionWithAnswersArr = viewValue;
                                scope.d.questionsWithAnswers = allQuestionWithAnswersArr;
                                znkExerciseDrvCtrl.setExerciseAsReady();
                            }

                            ngModelCtrl.$render = function () {
                                render(ngModelCtrl.$viewValue);
                            };

                            questionAnswersToOneObjectfmtr.formatter = function (answers) {
                                if (!answers) {
                                    answers = [];
                                }

                                var answersMap = {};
                                answers.forEach(function (answer) {
                                    if (answer && angular.isDefined(answer.questionId)) {
                                        answersMap[answer.questionId] = answer;
                                    }
                                });

                                var questions = scope.questionsGetter() || [];

                                var questionsWithAnswers = questions.map(function (question, index) {
                                    var questionCopy = angular.copy(question);
                                    var answer = answersMap[questionCopy.id] || {};

                                    questionCopy.__questionStatus = {
                                        index: index
                                    };
                                    for (var prop in answer) {
                                        questionCopy.__questionStatus[prop] = answer[prop];
                                    }

                                    return questionCopy;
                                });
                                return questionsWithAnswers;
                            };
                            ngModelCtrl.$formatters.push(questionAnswersToOneObjectfmtr.formatter);

                            questionAnswersToOneObjectfmtr.parser = function (questionsWithAnswersArr) {
                                scope.d.answeredCount = 0;

                                var results = ngModelCtrl.$modelValue || [];

                                questionsWithAnswersArr.forEach(function (questionWithAnswer, index) {
                                    if (angular.isUndefined(questionWithAnswer.__questionStatus)) {
                                        return;
                                    }

                                    var answer = {
                                        questionId: questionWithAnswer.id
                                    };

                                    var propsToCopyFromQuestionStatus = ['blackboardData', 'timeSpent', 'bookmark', 'userAnswer', 'isAnsweredCorrectly', 'audioEnded'];
                                    propsToCopyFromQuestionStatus.forEach(function (propName) {
                                        var value = questionWithAnswer.__questionStatus[propName];
                                        if (angular.isDefined(value)) {
                                            answer[propName] = value;
                                        }
                                    });

                                    if (angular.isDefined(answer.userAnswer)) {
                                        scope.d.answeredCount++;
                                    }

                                    results[index] = answer;
                                });

                                return results;
                            };
                            ngModelCtrl.$parsers.push(questionAnswersToOneObjectfmtr.parser);

                            scope.d.questionAnswered = function () {
                                scope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, getCurrentQuestion());
                                if (scope.settings.viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    setViewValue();
                                }
                                scope.settings.onQuestionAnswered(scope.d.currentSlide);
                                questionAnswered = true;
                                scope.settings.slideDirection = scope.settings.slideDirectionChange;
                            };

                            scope.d.bookmarkCurrentQuestion = function () {
                                var currQuestion = getCurrentQuestion();
                                currQuestion.__questionStatus.bookmark = !currQuestion.__questionStatus.bookmark;
                                scope.$broadcast(ZnkExerciseEvents.BOOKMARK, currQuestion);
                                setViewValue();
                            };

                            function updateTimeSpentOnQuestion(questionNum) {
                                questionNum = angular.isDefined(questionNum) ? questionNum : scope.d.currentSlide;
                                if (scope.settings.viewMode === ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    return;
                                }

                                if (!updateTimeSpentOnQuestion.lastTimeStamp) {
                                    updateTimeSpentOnQuestion.lastTimeStamp = Date.now();
                                    return;
                                }
                                var currTime = Date.now();
                                var timePassed = currTime - updateTimeSpentOnQuestion.lastTimeStamp;
                                updateTimeSpentOnQuestion.lastTimeStamp = currTime;
                                var question = scope.d.questionsWithAnswers[questionNum];
                                question.__questionStatus.timeSpent = (question.__questionStatus.timeSpent || 0) + timePassed;
                            }

                            scope.$watch('d.currentSlide', function (value, prevValue) {
                                updateTimeSpentOnQuestion(prevValue);
                                if (toolboxModalSettings.actions && toolboxModalSettings.actions.setToolValue) {
                                    var currQuestion = getCurrentQuestion();
                                    toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BOOKMARK, !!currQuestion.__questionStatus.bookmark);
                                }
                                znkExerciseDrvCtrl.questionChangeResolver(null);
                                questionAnswered = false;
                                scope.settings.onSlideChange();
                                scope.$broadcast(ZnkExerciseEvents.QUESTION_CHANGED,value,prevValue);
                                //var url = $location.url() + '/' + scope.d.questionsWithAnswers[value].id;
                                //$analytics.pageTrack(url);
                            });

                            scope.$watch('settings.slideDirection', function (val) {
                                if (val === ZnkExerciseSrv.slideDirections.NONE) {
                                    znkExerciseDrvCtrl.questionChangeResolver(function () {
                                        var defer = $q.defer();
                                        if (znkExerciseDrvCtrl.isCurrentQuestionAnswered()) {
                                            defer.resolve();
                                        }
                                        return defer.promise;
                                    });
                                }
                            });

                            scope.$on('$destroy', function () {
                                if (toolBoxModalInstance) {
                                    toolBoxModalInstance.close();
                                }
                            });
                        }
                    };
                }
            };
        }
    ]);
})(angular);

