/**
 * attrs:
 *  questions: questions array
 *  ngModel: results array
 *  settings:
 *      onNext
 *      onLastNext
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
        'ZnkExerciseSrv', '$location', /*'$analytics',*/ '$window', '$q', 'ZnkExerciseEvents', 'PlatformEnum', '$log',
        function (ZnkExerciseSrv, $location, /*$analytics, */$window, $q, ZnkExerciseEvents, PlatformEnum, $log) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExerciseDrv.html',
                restrict: 'E',
                transclude: true,
                require: ['znkExercise','ngModel'],
                scope: {
                    questionsGetter: '&questions',
                    settings: '=?',
                    actions: '=?'
                },
                controller: [
                    '$scope',
                    function ($scope) {
                        var self = this;

                        self.getViewMode = function(){
                            return $scope.settings.viewMode;
                        };

                        self.getSlideDirection = function(){
                            return $scope.settings.slideDirection;
                        };

                        //set resolver which control when to go to next question (if at all) when click on next button
                        var onNextResolver;
                        self.setQuestionChangeResolver = function(_onNextResolver){
                            onNextResolver = _onNextResolver;
                        };

                        self.__changeQuestionResolver = function(){
                            return $q.when((typeof onNextResolver === 'function') ? onNextResolver() : onNextResolver);
                        };

                        self.questionRendered = function(){
                            if(!self.__exerciseReady){
                                self.__exerciseReady = true;
                                if($scope.settings.onExerciseReady){
                                    $scope.settings.onExerciseReady();
                                }
                            }
                        };

                        self.getCurrentIndex = function(){
                            return $scope.d.currentSlide;
                        };
                    }],
                compile: function(element){
                    var platform = ZnkExerciseSrv.getPlatform();
                    if(!platform){
                        $log.$error('znkExercise directive: undefined platform received.');
                    }
                    var PlatformEnumMap = PlatformEnum.getEnumMap();
                    element.addClass(PlatformEnumMap[platform]);

                    return {
                        pre: function (scope, element, attrs, ctrls) {
                            var defaultSettings = {
                                onNext: function () {
                                    scope.d.currentSlide++;
                                },
                                onLastNext: angular.noop,
                                onQuestionAnswered: angular.noop,
                                viewMode: ZnkExerciseSrv.viewModeEnum.answerWithResult.enum,
                                onSlideChange: angular.noop
                            };
                            scope.settings = angular.extend(defaultSettings,scope.settings);

                            var znkExerciseDrvCtrl = ctrls[0];
                            var ngModelCtrl = ctrls[1];

                            var questionAnswersToOneObjectfmtr = {},
                                allQuestionWithAnswersArr,
                                isMobile = $window.innerWidth <= 567;

                            var questionAnswered;

                            scope.d = {
                                currentSlide: scope.settings.initSlideIndex || 0,
                                answeredCount: 0,
                                reviewModeId: ZnkExerciseSrv.viewModeEnum.review.enum,
                                mustAnswerId: ZnkExerciseSrv.viewModeEnum.mustAnswer.enum,
                                slideDirections: ZnkExerciseSrv.slideDirections
                            };

                            scope.actions = scope.actions || {};
                            scope.actions.setSlideIndex = function setSlideIndex(index) {
                                scope.d.currentSlide = index;
                            };
                            scope.actions.getCurrentIndex = function(){
                                return scope.d.currentSlide;
                            };
                            scope.actions.finishExercise = function(){
                                updateTimeSpentOnQuestion();
                                setViewValue();
                            };

                            function getCurrentQuestion(){
                                return allQuestionWithAnswersArr[scope.d.currentSlide];
                            }

                            var toolboxModalSettings = {
                                toolsToHide: scope.settings.toolsToHide,
                                wrapperCls: scope.settings.toolBoxWrapperClass || ''
                            };
                            toolboxModalSettings.events = {
                                onToolOpened: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch(evt.tool){
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BLACKBOARD,currQuestion.__questionStatus.blackboardData || {});
                                            if(isMobile){
                                                scope.d.hidePager = true;
                                            }
                                            break;
                                    }
                                },
                                onToolClosed: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch(evt.tool){
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            currQuestion.__questionStatus.blackboardData = evt.value;
                                            if(isMobile){
                                                scope.d.hidePager = false;
                                            }
                                            break;
                                    }
                                    setViewValue();
                                },
                                onToolValueChanged: function(evt){
                                    switch(evt.tool){
                                        case ZnkExerciseSrv.toolBoxTools.BOOKMARK:
                                            scope.d.bookmarkCurrentQuestion();
                                            break;
                                    }
                                    setViewValue();
                                }
                            };
                            var toolBoxModalInstance = ZnkExerciseSrv.openExerciseToolBoxModal(toolboxModalSettings);

                            function setViewValue() {
                                if(scope.settings.viewMode === ZnkExerciseSrv.viewModeEnum.review.enum){
                                    return;
                                }
                                ngModelCtrl.$setViewValue(angular.copy(scope.d.questionsWithAnswers));
                            }

                            function render(viewValue) {
                                allQuestionWithAnswersArr = viewValue;
                                scope.d.questionsWithAnswers = allQuestionWithAnswersArr;
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
                                    answersMap[answer.questionId] = answer;
                                });

                                var questions = scope.questionsGetter() || [];

                                var questionsWithAnswers = questions.map(function (question, index) {
                                    var questionCopy = angular.copy(question);
                                    var answer = answersMap[questionCopy.id] || {};

                                    questionCopy.__questionStatus = {
                                        index: index
                                    };
                                    for(var prop in answer){
                                        questionCopy.__questionStatus[prop] = answer[prop];
                                    }

                                    return questionCopy;
                                });
                                return questionsWithAnswers;
                            };
                            ngModelCtrl.$formatters.push(questionAnswersToOneObjectfmtr.formatter);

                            questionAnswersToOneObjectfmtr.parser = function (questionsWithAnswersArr) {
                                scope.d.answeredCount = 0;

                                questionsWithAnswersArr.forEach(function (questionWithAnswer, index) {
                                    if (angular.isUndefined(questionWithAnswer.__questionStatus)) {
                                        return;
                                    }

                                    var answer = {
                                        questionId: questionWithAnswer.id
                                    };

                                    var propsToCopyFromQuestionStatus = ['blackboardData','timeSpent','bookmark','userAnswer','isAnsweredCorrectly', 'audioEnded'];
                                    propsToCopyFromQuestionStatus.forEach(function(propName){
                                        var value = questionWithAnswer.__questionStatus[propName];
                                        if (angular.isDefined(value)) {
                                            answer[propName] = value;
                                        }
                                    });

                                    if (angular.isDefined(answer.userAnswer)) {
                                        scope.d.answeredCount++;
                                    }

                                    ngModelCtrl.$modelValue[index] = answer;
                                });

                                return ngModelCtrl.$modelValue;
                            };
                            ngModelCtrl.$parsers.push(questionAnswersToOneObjectfmtr.parser);

                            scope.d.questionAnswered = function () {
                                scope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED,getCurrentQuestion());
                                setViewValue();
                                scope.settings.onQuestionAnswered(scope.d.currentSlide);
                                questionAnswered = true;
                                scope.settings.slideDirection = scope.settings.slideDirectionChange;
                            };

                            scope.d.bookmarkCurrentQuestion = function () {
                                var currQuestion  = getCurrentQuestion();
                                currQuestion.__questionStatus.bookmark = !currQuestion.__questionStatus.bookmark;
                                scope.$broadcast(ZnkExerciseEvents.BOOKMARK,currQuestion);
                                setViewValue();
                            };

                            scope.d.next = function () {
                                var questionIndex = scope.d.currentSlide;
                                var lastQuestion = allQuestionWithAnswersArr[allQuestionWithAnswersArr.length - 1];
                                znkExerciseDrvCtrl.__changeQuestionResolver().then(function(){
                                    if (lastQuestion !== scope.d.questionsWithAnswers[questionIndex] && scope.d.answeredCount !== scope.d.questionsWithAnswers.length) {
                                        scope.settings.onNext();
                                    } else {
                                        updateTimeSpentOnQuestion();
                                        setViewValue();
                                        scope.settings.onLastNext();
                                    }
                                    questionAnswered = false;
                                });
                            };

                            function updateTimeSpentOnQuestion(questionNum) {
                                questionNum = angular.isDefined(questionNum) ? questionNum : scope.d.currentSlide;
                                if(scope.settings.viewMode === ZnkExerciseSrv.viewModeEnum.review.enum){
                                    return;
                                }

                                if(!updateTimeSpentOnQuestion.lastTimeStamp){
                                    updateTimeSpentOnQuestion.lastTimeStamp = Date.now();
                                    return;
                                }
                                var currTime = Date.now();
                                var timePassed = currTime - updateTimeSpentOnQuestion.lastTimeStamp;
                                updateTimeSpentOnQuestion.lastTimeStamp = currTime;
                                var question = scope.d.questionsWithAnswers[questionNum];
                                question.__questionStatus.timeSpent = (question.__questionStatus.timeSpent || 0) + timePassed;
                            }

                            scope.$watch('d.currentSlide', function (value,prevValue) {
                                updateTimeSpentOnQuestion(prevValue);
                                if (toolboxModalSettings.actions && toolboxModalSettings.actions.setToolValue) {
                                    var currQuestion = getCurrentQuestion();
                                    toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BOOKMARK,!!currQuestion.__questionStatus.bookmark);
                                }

                                znkExerciseDrvCtrl.setQuestionChangeResolver(null);
                                questionAnswered = false;
                                scope.settings.onSlideChange();

                                //var url = $location.url() + '/' + scope.d.questionsWithAnswers[value].id;
                                //$analytics.pageTrack(url);
                            });

                            function slideProm() {
                                var defer = $q.defer();
                                if(questionAnswered) {
                                    defer.resolve();
                                }
                                return defer.promise;
                            }

                            scope.$watch('settings.slideDirection', function(val) {
                                if(val === ZnkExerciseSrv.slideDirections.NONE) {
                                    znkExerciseDrvCtrl.setQuestionChangeResolver(slideProm);
                                }
                            });

                            if($window.plugins && $window.plugins.insomnia) {
                                $window.plugins.insomnia.keepAwake();
                            }

                            scope.$on('$destroy',function(){
                                if(toolBoxModalInstance){
                                    toolBoxModalInstance.close();
                                }
                                if($window.plugins && $window.plugins.insomnia) {
                                    $window.plugins.insomnia.allowSleepAgain();
                                }
                            });
                        }
                    }
                }
            };
        }
    ]);
})(angular);

