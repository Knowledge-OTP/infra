(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', [
        'ngAnimate',
        'pascalprecht.translate',
        'znk.infra.znkQuestionReport',
        'znk.infra.svgIcon',
        'znk.infra.scroll',
        'znk.infra.autofocus',
        'znk.infra.exerciseUtility',
        'znk.infra.analytics',
        'znk.infra.popUp',
        'znk.infra.user',
        'znk.infra.utility'
    ])
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'znk-exercise-chevron': 'components/znkExercise/svg/chevron-icon.svg',
                'znk-exercise-eraser': 'components/znkExercise/svg/tools-eraser.svg',
                'znk-exercise-pencil': 'components/znkExercise/svg/tools-pencil.svg',
                'znk-exercise-pointer': 'components/znkExercise/svg/tools-pointer.svg',
                'znk-exercise-remove': 'components/znkExercise/svg/tools-remove.svg',
                'znk-exercise-touche': 'components/znkExercise/svg/tools-touche.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    var typeToViewMap;
    angular.module('znk.infra.znkExercise').directive('answerBuilder', [
        '$compile', 'AnswerTypeEnum', 'ZnkExerciseUtilitySrv', 'ZnkExerciseViewModeEnum',
        function ($compile, AnswerTypeEnum, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum) {
            if(!typeToViewMap) {
                typeToViewMap = {};
                angular.forEach(AnswerTypeEnum, function (enumData, enumName) {
                    var directiveName = enumName.toLowerCase().replace(/_/g, '-');
                    typeToViewMap[enumData.enum] = '<' + directiveName + '></' + directiveName + '>';
                });
            }

            return {
                require: ['answerBuilder','^questionBuilder', '^ngModel'],
                restrict: 'E',
                controller:[
                    function(){

                    }
                ],
                link: {
                    pre:function (scope, element, attrs, ctrls) {
                        var answerBuilderCtrl = ctrls[0];
                        var questionBuilderCtrl = ctrls[1];
                        var ngModelCtrl = ctrls[2];

                        var fnToBindFromQuestionBuilder = ['getViewMode', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(answerBuilderCtrl,questionBuilderCtrl,fnToBindFromQuestionBuilder);

                        answerBuilderCtrl.canUserAnswerBeChanged = function(){
                            var viewMode = questionBuilderCtrl.getViewMode();
                            var isntReviewMode = viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                            var notAnswered = angular.isDefined(ngModelCtrl.$viewValue);
                            var isAnswerWithResultViewMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                            return isntReviewMode && isAnswerWithResultViewMode && notAnswered;
                        };

                        answerBuilderCtrl.question = questionBuilderCtrl.question;

                        var answerType = questionBuilderCtrl.question.answerTypeId;
                        var answerHtml = typeToViewMap[answerType];
                        element.html(answerHtml);
                        $compile(element.contents())(scope);
                    }
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseAnswersSrv', function () {
        this.config = {
            selectAnswer:{}
        };

        var selectAnswer = {};

        this.config.selectAnswer.setAnswerIndexFormatter = function(fn){
            selectAnswer.answerIndexFormatter = fn;
        };

        this.$get = [
            function () {
                var ZnkExerciseAnswersSrv = {
                    selectAnswer: {}
                };

                ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex = function(answerIndex){
                    var formattedAnswerIndex;

                    if(selectAnswer.answerIndexFormatter){
                        formattedAnswerIndex = selectAnswer.answerIndexFormatter.apply(this,arguments);
                    }

                    if(angular.isUndefined(formattedAnswerIndex)){
                        var UPPER_A_ASCII_CODE = 65;
                        formattedAnswerIndex  = String.fromCharCode(UPPER_A_ASCII_CODE + answerIndex);
                    }

                    return formattedAnswerIndex;
                };

                return ZnkExerciseAnswersSrv;
            }
        ];
    });
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('markup', [
        '$window',
        function ($window) {
            var _isMobile = false;//MobileSrv.isMobile();
            var MAX_IMAGE_WIDTH = 275;
            var dummyElem = angular.element('<P/>');
            return {
                replace: true,
                restrict: 'E',
                link: function (scope, element, attrs) {

                    var toDomElement = function domElement(markup) {
                        dummyElem.append(markup);
                        return dummyElem.contents();
                    };

                    var imageStyle = function imageStyle(image){
                        var _style = {
                            width: '',
                            height: ''
                        };

                        if(image.style.width){
                            var _height = image.style.height;
                            var _width = image.style.width;

                            _height = _height.replace('px','');
                            _width = _width.replace('px','');

                            if(!isNaN(_width)){
                                _width = parseInt(_width);

                                while(_width > MAX_IMAGE_WIDTH){
                                    _width = _width * 0.90;
                                    _height = _height * 0.90;
                                }
                                _style.width = _width + 'px';
                                _style.height = _height + 'px';
                            }
                        }
                        return _style;
                    };

                    var resizeImages = function resizeImages(domElement){
                        var style;

                        for(var i=0; i<domElement.length; i++ ){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'img')
                            {
                                if(domElement[i].style.width){
                                    style = imageStyle(domElement[i]);
                                    domElement[i].style.width = style.width;
                                    domElement[i].style.height = style.height;
                                }
                            }
                            else{
                                var _images = angular.element(domElement[i]).find('img');
                                if(_images.length){
                                    for(var x=0; x<_images.length; x++){
                                        if(_images[x].style.width){
                                            style = imageStyle(_images[x]);
                                            _images[x].style.width = style.width;
                                            _images[x].style.height = style.height;
                                        }
                                    }
                                }
                            }
                        }

                        return domElement;
                    };

                    var removeLeftMargin = function removeLeftMargin(domElement){

                        for(var i=0; i<domElement.length; i++){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'p')
                            {
                                if(!domElement[i].style) {
                                    break;
                                }

                                var marginLeft = domElement[i].style.marginLeft;
                                marginLeft = marginLeft ?  marginLeft.replace('px','') : marginLeft;

                                if(marginLeft && !isNaN(marginLeft))
                                {
                                    domElement[i].style.marginLeft = 0;
                                }
                            }
                        }

                        return domElement;
                    };

                    var watchDestroyer = scope.$watch(attrs.content,function(newVal){
                        if(!!newVal){

                            if(_isMobile){
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.05);
                            }
                            else{
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.25);
                            }

                            var _domElements = toDomElement(newVal);
                            if(_domElements) {
                                var _newDomElements = resizeImages(_domElements);

                                //remove left margin from <p> tag
                                _newDomElements = removeLeftMargin(_newDomElements);

                                element.append(_newDomElements);
                            }

                            watchDestroyer();
                        }
                    });
                }
            };
        }
    ]);
})(angular);


'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('arrayToStringFmtr', [
        function () {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelCtrl) {
                    function parser(val){
                        if(!val || !val.length){
                            return undefined;
                        }
                        return val.join('');
                    }
                    ngModelCtrl.$parsers.push(parser);

                    function formatter(val){
                        if (!val || !val.length) {
                            return [];
                        }
                        return val.match(/.{1}/g);
                    }
                    ngModelCtrl.$formatters.push(formatter);
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('BaseZnkExerciseController',
        ["$scope", "exerciseData", "exerciseSettings", "$state", "$q", "ExerciseTypeEnum", "$location", "ExerciseResultSrv", "ZnkExerciseSrv", "$filter", "PopUpSrv", "exerciseEventsConst", "$rootScope", "ZnkExerciseUtilitySrv", "ZnkExerciseViewModeEnum", "SubjectEnum", "znkAnalyticsSrv", "$translate", "$log", "StatsEventsHandlerSrv", function ($scope, exerciseData, exerciseSettings, $state, $q, ExerciseTypeEnum, $location, ExerciseResultSrv, ZnkExerciseSrv,
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
        }]);

})(angular);

(function (angular) {
    'use strict';

    var ZnkExerciseEvents = {
        BOOKMARK: 'znk exercise:bookmark',
        QUESTION_ANSWERED: 'znk exercise:question answered',
        READY: 'znk exercise: exercise ready',
        QUESTION_CHANGED: 'znk exercise: question changed',
        QUESTIONS_NUM_CHANGED: 'znk exercise: questions num changed',
        SLIDE_DIRECTION_CHANGED: 'znk exercise: slide direction changed'
    };
    angular.module('znk.infra.znkExercise').constant('ZnkExerciseEvents', ZnkExerciseEvents);
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionBuilder', [
        '$compile', 'QuestionTypesSrv', '$timeout', 'ZnkExerciseUtilitySrv',
        function ($compile, QuestionTypesSrv, $timeout, ZnkExerciseUtilitySrv) {
            return {
                restrict: 'E',
                require: ['questionBuilder', '^znkExercise'],
                scope: {
                    questionGetter: '&question'
                },
                controller: [
                    '$scope',
                    function ($scope) {
                        var self = this;

                        self.question = $scope.questionGetter();
                    }
                ],
                link: {
                    pre: function pre(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var functionsToBind = ['getViewMode','addQuestionChangeResolver','removeQuestionChangeResolver', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(questionBuilderCtrl, znkExerciseCtrl,functionsToBind);

                        questionBuilderCtrl.bindExerciseEventManager = znkExerciseCtrl.bindExerciseEventManager;
                    },
                    post: function post(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        QuestionTypesSrv.getQuestionHtmlTemplate(questionBuilderCtrl.question).then(function(result){
                            var questionHtmlTemplate = result;
                            element.append(questionHtmlTemplate);
                            var childScope = scope.$new(true);
                            $compile(element.contents())(childScope);
                        });

                        //after 2 digests at max the question should be rendered
                        var innerTimeout;
                        $timeout(function(){
                            innerTimeout = $timeout(function(){
                                znkExerciseCtrl.notifyQuestionBuilderReady(questionBuilderCtrl.question.__questionStatus.index);
                            });
                        },0,false);

                        questionBuilderCtrl.setViewValue = znkExerciseCtrl.setViewValue;

                        scope.$on('$destroy', function(){
                            $timeout.cancel(innerTimeout);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *      disableSwipe
 *      questions
 *      onQuestionAnswered
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionsCarousel', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseSlideDirectionEnum', '$timeout',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseSlideDirectionEnum, $timeout) {
            return {
                templateUrl: function(){
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'questionSwiperDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'questionSwiperMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                require: 'ngModel',
                scope:{
                    questionsGetter: '&questions',
                    onQuestionAnswered: '&'

                },
                link: function (scope, element, attrs, ngModelCtrl) {
                    scope.vm = {};

                    ngModelCtrl.$render = function(){
                        scope.vm.currSlideIndex = ngModelCtrl.$viewValue;
                    };

                    scope.vm.SlideChanged = function(){
                        ngModelCtrl.$setViewValue(scope.vm.currSlideIndex);
                    };


                    attrs.$observe('slideDirection',function(newSlideDirection){
                        var slideDirection = +newSlideDirection;
                        if(!scope.vm.swiperActions || isNaN(slideDirection)){
                            return;
                        }

                        switch (slideDirection){
                            case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                scope.vm.swiperActions.lockSwipes();
                                break;
                            case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                scope.vm.swiperActions.unlockSwipeToPrev();
                                scope.vm.swiperActions.lockSwipeToNext();
                                break;
                            case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                scope.vm.swiperActions.lockSwipeToPrev();
                                scope.vm.swiperActions.unlockSwipeToNext();
                                break;
                            default:
                                scope.vm.swiperActions.unlockSwipes();
                        }
                    });

                    scope.$watchGroup(['questionsGetter()', 'questionsGetter().length'],function(newValArr, oldValArr){
                        var newQuestionsArr = newValArr[0];
                        scope.vm.questions = newQuestionsArr || [];

                        var newNum = newValArr[1];
                        var oldNum = oldValArr[1];
                        if(oldNum && newNum !== oldNum){
                            $timeout(function(){
                                scope.vm.swiperActions.updateFollowingSlideAddition();
                            });
                        }
                    });
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *  prev-question
 *  next-question
 *  onDone
 *  questionsGetter
 *  actions:
 *      forceDoneBtnDisplay:
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum', '$q', 'ZnkExerciseSlideDirectionEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents, ZnkExerciseViewModeEnum, $q, ZnkExerciseSlideDirectionEnum) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    onDone: '&',
                    questionsGetter: '&questions',
                    actions: '='
                },
                require: '^znkExercise',
                templateUrl: function () {
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'btnSectionDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'btnSectionMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        function _setCurrentQuestionIndex(index){
                            scope.vm.currentQuestionIndex = index || 0;
                        }

                        function _notReviewMode() {
                            return viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                        }

                        function _isLastQuestion(index, questions) {
                            return angular.isDefined(index) && index === (questions.length - 1);
                        }

                        function _determineDoneBtnDisplayStatus() {
                            var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                            var areAllQuestionsAnsweredProm = znkExerciseDrvCtrl.areAllQuestionsAnswered();
                            $q.all([getQuestionsProm, areAllQuestionsAnsweredProm]).then(function (results) {
                                if(isDoneBtnDisplayForced){
                                    return;
                                }
                                var questions = results[0];
                                var areAllQuestionsAnswered = results[1];

                                var currIndex = znkExerciseDrvCtrl.getCurrentIndex();

                                if (_notReviewMode() && (_isLastQuestion(currIndex, questions) || areAllQuestionsAnswered)) {
                                    _setDoneBtnStatus(true);
                                } else {
                                    _setDoneBtnStatus(false);
                                }
                            });
                        }

                        function _setDoneBtnStatus(showDoneBtn){
                            scope.vm.showDoneButton = !!showDoneBtn;

                            var znkExerciseElement = znkExerciseDrvCtrl.getElement();
                            if(showDoneBtn){
                                znkExerciseElement.addClass('done-btn-show');
                            }else{
                                znkExerciseElement.removeClass('done-btn-show');
                            }
                        }

                        function init(){
                            znkExerciseDrvCtrl.getQuestions().then(function (questions) {
                                scope.vm.maxQuestionIndex = questions.length - 1;
                            });
                            _setCurrentQuestionIndex(znkExerciseDrvCtrl.getCurrentIndex());
                        }

                        var viewMode = znkExerciseDrvCtrl.getViewMode();

                        scope.vm = {};

                        if(!scope.actions){
                            scope.actions = {};
                        }

                        var isDoneBtnDisplayForced;
                        scope.actions.forceDoneBtnDisplay = function(display){
                            isDoneBtnDisplayForced = display === false || display === true;

                            if(isDoneBtnDisplayForced){
                                _setDoneBtnStatus(display);
                            }else{
                                _determineDoneBtnDisplayStatus();
                            }
                        };

                        init();

                        scope.vm.prevQuestion = function () {
                            scope.prevQuestion();
                        };

                        scope.vm.nextQuestion = function () {
                            scope.nextQuestion();
                        };

                        znkExerciseDrvCtrl.notifyBtnSectionReady();

                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            _setCurrentQuestionIndex(newIndex);
                            _determineDoneBtnDisplayStatus(newIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, function(evt, newQuestionNum){
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            scope.vm.maxQuestionIndex = newQuestionNum - 1;
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED, function(evt, newDirection){
                            var slideDirectionEnum = ZnkExerciseSlideDirectionEnum.getNameToEnumMap();
                            switch(newDirection){
                                case slideDirectionEnum.NONE:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.LEFT:
                                    scope.vm.slideLeftAllowed = true;
                                    scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.RIGHT:
                                    scope.vm.slideLeftAllowed = false;
                                    scope.vm.slideRightAllowed = true;
                                    break;
                                default:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = true;
                                    break;
                            }
                        });

                        function keyboardClickCB(e){
                            var LEFT_ARROW_KEY = 37;
                            var RIGHT_ARROW_KEY = 39;

                            switch(e.keyCode){
                                case LEFT_ARROW_KEY:
                                    scope.vm.prevQuestion();
                                    break;
                                case RIGHT_ARROW_KEY:
                                    scope.vm.nextQuestion();
                                    break;
                            }
                        }
                        var body = document.body;
                        body.addEventListener('keyup',keyboardClickCB);

                        var currentQuestionAnsweredWatchFn;
                        if(_notReviewMode()){
                            currentQuestionAnsweredWatchFn = function(){
                                return znkExerciseDrvCtrl.isCurrentQuestionAnswered();
                            };
                            scope.$watch(currentQuestionAnsweredWatchFn,function(isAnswered){
                                scope.vm.isCurrentQuestionAnswered = !!isAnswered;
                            });
                        }

                        scope.$on('$destroy',function(){
                            body.removeEventListener('keyup',keyboardClickCB);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *
 *  actions:
 *      updateContainerSize
 *      lockSwipes
 *      lockSwipeToPrev
 *      lockSwipeToNext
 *      unlockSwipes
 *      unlockSwipeToPrev
 *      unlockSwipeToNext
 *      enableKeyboardControl
 *      disableKeyboardControl
 *      noSwiping
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkSwiper', [
        '$timeout', '$q',
        function ($timeout, $q) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkSwiperTemplate.html',
                replace: true,
                restrict: 'E',
                require: 'ngModel',
                scope:{},
                transclude: true,
                compile:function(){
                    var defer, swiperInstanceProm, swiperInstance;

                    function preLink(scope,element,attrs,ngModelCtrl){
                        defer = $q.defer();
                        swiperInstanceProm = defer.promise;

                        if(attrs.actions){
                            if(!scope.$parent.$eval(attrs.actions)){
                                scope.$parent.$eval(attrs.actions + '={}');
                            }
                            var actions = scope.$parent.$eval(attrs.actions);

                            var fnToBindFromSwiper = [
                                'lockSwipes', 'lockSwipeToPrev', 'lockSwipeToNext', 'unlockSwipes',
                                'unlockSwipeToPrev', 'unlockSwipeToNext', 'noSwiping'
                            ];
                            fnToBindFromSwiper.forEach(function(fnName){
                                actions[fnName] = function(){
                                    var fnArgs = arguments;
                                    swiperInstanceProm.then(function(){
                                        swiperInstance[fnName].apply(swiperInstance,fnArgs);
                                    });
                                };
                            });

                            actions.updateFollowingSlideAddition = function(){
                                return swiperInstanceProm.then(function(){
                                    swiperInstance.updateContainerSize();
                                    swiperInstance.updateSlidesSize();
                                });
                            };
                        }

                        ngModelCtrl.$render = function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            if(angular.isNumber(currSlideIndex)){
                                swiperInstanceProm.then(function(){
                                    swiperInstance.slideTo(currSlideIndex);
                                });
                            }
                        };

                        swiperInstanceProm.then(function(){
                            swiperInstance.on('onSlideChangeEnd',function(){
                                ngModelCtrl.$setViewValue(swiperInstance.activeIndex);
                            });
                        });

                        scope.$on('$destroy',function(){
                            if(swiperInstance){
                                swiperInstance.off('onSlideChangeEnd');
                                swiperInstance.destroy(true, true);
                                swiperInstance = null;
                            }
                        });
                    }

                    function postLink(scope,element,attrs,ngModelCtrl){
                        $timeout(function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;

                            currSlideIndex = Math.max(currSlideIndex, 0);

                            swiperInstance = new Swiper(element[0], {
                                initialSlide: currSlideIndex || 0,
                                onlyExternal: true
                            });
                            defer.resolve();
                        });
                    }

                    return {
                        pre: preLink,
                        post: postLink
                    };
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';
    angular.module('znk.infra.znkExercise').provider('QuestionTypesSrv', function QuestionTypesProvider() {
        var questionTypeToHtmlTemplateMap = {};
        this.setQuestionTypesHtmlTemplate = function (_questionTypeToHtmlTemplateMap) {
            questionTypeToHtmlTemplateMap = _questionTypeToHtmlTemplateMap;
        };

        var questionTypeGetterFn = angular.noop;
        this.setQuestionTypeGetter = function(typeGetterFn){
            questionTypeGetterFn = typeGetterFn;
        };

        var answersFormaterObjMap = {};        
        this.setAnswersFormatValidtors = function (_answersFormaterObjMap) {
            answersFormaterObjMap = _answersFormaterObjMap;
        };

        this.$get = [
            '$log','$q',
            function ($log, $q) {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(question) {
                    return $q.when(questionTypeGetterFn(question)).then(function(questionType){
                        var questionTypeId = questionType;
                        if(!questionTypeToHtmlTemplateMap[questionTypeId]){
                            $log.error('QuestionTypesSrv: Template was not registered for the following question type:',questionTypeId);
                        }
                        return questionTypeToHtmlTemplateMap[questionTypeId];
                    });
                };

                QuestionTypesSrv.getQuestionType = function getQuestionType(question) {
                    return questionTypeGetterFn(question);
                };

                QuestionTypesSrv.checkAnswerAgainstFormatValidtors = function (userAnswer, answerTypeId, callbackValidAnswer, callbackUnValidAnswer, question) {   
                    if (!angular.isFunction(callbackValidAnswer)) { // callbackUnValidAnswer is optional
                        $log.error('QuestionTypesSrv checkAnswerAgainstFormatValidtors: callbackValidAnswer are missing!');
                        return;
                    }

                   var answersFormaterArr = answersFormaterObjMap[answerTypeId];

                    // if there's no userAnswer or formatters or it's not an array then invoke callbackValidAnswer                    
                   if (angular.isUndefined(userAnswer) ||
                       !angular.isArray(answersFormaterArr) ||
                       !answersFormaterArr.length) {
                        callbackValidAnswer();
                        return;
                    }

                    var answersFormaterArrLength = answersFormaterArr.length;

                    var answerValueBool, currentFormatter;                     
                    for (var i = 0; i < answersFormaterArrLength; i++) {
                        currentFormatter = answersFormaterArr[i];

                        if (angular.isFunction(currentFormatter)) {
                            answerValueBool = currentFormatter(userAnswer, question); // question is optional
                        }

                        if (currentFormatter instanceof RegExp) { // currentFormatter should be a regex pattren
                           answerValueBool = currentFormatter.test(userAnswer);
                        }

                        // break loop if userAnswer is a valid answer
                        if (typeof answerValueBool === "boolean" && answerValueBool) {
                            callbackValidAnswer();
                            break;
                        }
                        // if last iteration, then answer is un valid, invoke callbackUnValidAnswer if exist
                        if (i === answersFormaterArrLength - 1) {
                            if (callbackUnValidAnswer) {
                                callbackUnValidAnswer();
                            }
                        }
                    }
                };

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseSrv',
        function () {
            'ngInject';

            var exerciseTypeToAllowedQuestionTimeMap;
            this.setAllowedTimeForQuestionMap = function (_exerciseTypeToAllowedQuestionTimeMap) {
                exerciseTypeToAllowedQuestionTimeMap = _exerciseTypeToAllowedQuestionTimeMap;
            };

            var defaultBindExerciseKeys = [
                {
                    getterName: 'currSlideIndex',
                    setterName: 'setCurrentIndex'
                },
                {
                    getterName: 'answerExplanation'
                }
            ];

            var addBindExerciseKeys;

            var bindExerciseKeys;

            this.addBindExerciseKeys = function(_addBindExerciseKeys) {
                addBindExerciseKeys = _addBindExerciseKeys;
            };

            this.$get = ["EnumSrv", "$window", "PlatformEnum", "$log", function (EnumSrv, $window, PlatformEnum, $log) {
                'ngInject';//jshint ignore:line

                var platform = !!$window.ionic ? PlatformEnum.MOBILE.enum : PlatformEnum.DESKTOP.enum;
                var ZnkExerciseSrv = {};

                ZnkExerciseSrv.toolBoxTools = {
                    BLACKBOARD: 'blackboard',
                    MARKER: 'mar',
                    CALCULATOR: 'cal',
                    BOOKMARK: 'bookmark',
                    SHOW_PAGER: 'show pager'
                };

                function openExerciseToolBoxModal(/*toolBoxModalSettings*/) {
                    //var modalOptions = {
                    //    templateUrl: 'scripts/exercise/templates/znkExerciseToolBoxModal.html',
                    //    hideBackdrop: true,
                    //    ctrl: 'ZnkExerciseToolBoxModalCtrl',
                    //    ctrlAs: 'toolBoxCtrl',
                    //    dontCentralize: true,
                    //    wrapperClass: 'znk-exercise-toolbox ' + toolBoxModalSettings.wrapperCls,
                    //    resolve: {
                    //        Settings: toolBoxModalSettings
                    //    }
                    //};
                    //return ZnkModalSrv.modal(modalOptions);
                }

                ZnkExerciseSrv.openExerciseToolBoxModal = openExerciseToolBoxModal;

                ZnkExerciseSrv.getPlatform = function () {
                    return platform;
                };

                ZnkExerciseSrv.getAllowedTimeForQuestion = function (exerciseType) {
                    if(!exerciseTypeToAllowedQuestionTimeMap || !exerciseTypeToAllowedQuestionTimeMap[exerciseType]){
                        $log.error('ZnkExerciseSrv: the following exercise type:' + exerciseType +' has no question allowed time');
                    }
                    return exerciseTypeToAllowedQuestionTimeMap[exerciseType];
                };

                ZnkExerciseSrv.getBindExerciseKeys = function() {
                    if (!bindExerciseKeys) {
                        bindExerciseKeys = (angular.isArray(addBindExerciseKeys)) ?
                            defaultBindExerciseKeys.concat(addBindExerciseKeys) : defaultBindExerciseKeys;
                    }
                    return bindExerciseKeys;
                };

                ZnkExerciseSrv.toolBoxTools = {
                    BLACKBOARD: 'blackboard',
                    MARKER: 'mar',
                    CALCULATOR: 'cal',
                    BOOKMARK: 'bookmark',
                    SHOW_PAGER: 'show pager'
                };

                return ZnkExerciseSrv;
            }];
        }
    );
})(angular);

/**
 * attrs:
 *  questions: questions array
 *
 *  ngModel: results array
 *
 *  settings:
 *      allowedTimeForExercise: in milliseconds
 *      onDone
 *      onQuestionAnswered
 *      wrapperCls
 *      toolsToHide
 *      viewMode
 *      onExerciseReady
 *      onSlideChange
 *      initSlideIndex
 *      initSlideDirection
 *      initForceDoneBtnDisplay: null-default behaviour(default value), false-done button will be hidden, true-done button will be dispalyed
 *      initPagerDisplay: true- displayed(default value), false- hidden
 *      toolBox:{
 *          drawing:{
 *              exerciseDrawingPathPrefix: exercise drawing path prefix, question id will be concat to it for the full path.
 *              toucheColorId
 *          }
 *      }
 *
 *  actions:
 *      setSlideIndex
 *      getCurrentIndex
 *      finishExercise
 *      setSlideDirection
 *      forceDoneBtnDisplay
 *      pagerDisplay: function, if true provided than pager will be displayed other it will be hidden.
 *      getPagerDisplayState
 *      bindExerciseViewTo: receive as parameter the view state
 *          viewState properties:
 *              currSlideIndex, answerExplanation + add extra with ZnkExerciseSrvProvider.addBindExerciseKeys
 *              questionView: it implemented per question
 *      unbindExerciseView: remove exercise view binding
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercise', [
        'ZnkExerciseSrv', '$location', /*'$analytics',*/ '$window', '$q', 'ZnkExerciseEvents', 'PlatformEnum', '$log', 'ZnkExerciseViewModeEnum', 'ZnkExerciseSlideDirectionEnum', '$timeout', 'ZnkExerciseUtilitySrv',
        function (ZnkExerciseSrv, $location, /*$analytics, */$window, $q, ZnkExerciseEvents, PlatformEnum, $log, ZnkExerciseViewModeEnum, ZnkExerciseSlideDirectionEnum, $timeout, ZnkExerciseUtilitySrv) {
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
                                onSlideChange: angular.noop,
                                initSlideDirection: ZnkExerciseSlideDirectionEnum.ALL.enum,
                                initForceDoneBtnDisplay: null,
                                initPagerDisplay: true,
                                allowedTimeForExercise: Infinity
                            };

                            scope.settings.allowedTimeForExercise = +scope.settings.allowedTimeForExercise;
                            if(isNaN(scope.settings.allowedTimeForExercise)){
                                $log.error('znkExerciseDrv: allowed time for exercise was not set!!!!');
                            }
                            scope.settings = angular.extend(defaultSettings, scope.settings);

                            var znkExerciseDrvCtrl = ctrls[0];
                            var ngModelCtrl = ctrls[1];

                            var questionAnswersToOneObjectfmtr = {},
                                allQuestionWithAnswersArr,
                                isMobile = $window.innerWidth <= 567;

                            function questionChangeResolverForSlideDirection(requiredIndex, currIndex){
                                var currSlideDirection = scope.vm.slideDirection;
                                switch (currSlideDirection){
                                    case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                        return $q.reject();
                                    case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                        return currIndex > requiredIndex ? true : $q.reject(false);
                                    case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                        return currIndex < requiredIndex ? true : $q.reject(false);
                                    default:
                                        return true;
                                }
                            }
                            znkExerciseDrvCtrl.addQuestionChangeResolver(questionChangeResolverForSlideDirection);

                            scope.vm.answeredCount = 0;

                            znkExerciseDrvCtrl.setCurrentIndex(scope.settings.initSlideIndex || 0);
                            /**
                             *  ACTIONS
                             * */

                            scope.actions = scope.actions || {};

                            scope.actions.setSlideIndex = function setSlideIndex(index) {
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    znkExerciseDrvCtrl.setCurrentIndex(index);
                                });
                            };

                            scope.actions.getCurrentIndex = function () {
                                return znkExerciseDrvCtrl.getCurrentIndex();
                            };

                            scope.actions.finishExercise = function () {
                                updateTimeSpentOnQuestion();
                            };

                            scope.actions.setSlideDirection = function(newSlideDirection){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    if(angular.isDefined(newSlideDirection)){
                                        //  do nothing incase the slide direction was not changed
                                        if(scope.vm.slideDirection === newSlideDirection){
                                            return;
                                        }

                                        var isRightDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.RIGHT.enum;
                                        var isLeftDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.LEFT.enum;
                                        var isAllDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.ALL.enum;
                                        var DIRECTION_CLASS_PREFIX = 'direction';

                                        var rightDirectionClass =DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.RIGHT.val;
                                        if(isRightDirection || isAllDirection){
                                            element.addClass(rightDirectionClass);
                                        }else{
                                            element.removeClass(rightDirectionClass);
                                        }

                                        var leftDirectionClass=DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.LEFT.val;
                                        if(isLeftDirection || isAllDirection){
                                            element.addClass(leftDirectionClass);
                                        }else{
                                            element.removeClass(leftDirectionClass);
                                        }

                                        scope.vm.slideDirection = newSlideDirection;

                                        scope.$broadcast(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED,newSlideDirection);
                                    }
                                });
                            };

                            scope.actions.forceDoneBtnDisplay = function(display){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    scope.vm.btnSectionActions.forceDoneBtnDisplay(display);
                                });
                            };

                            scope.actions.pagerDisplay = function(display){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    var showPager = !!display;
                                    if(showPager){
                                        element.addClass('pager-displayed');
                                    }else{
                                        element.removeClass('pager-displayed');
                                    }
                                    scope.vm.showPager = !!display;
                                });
                            };

                            scope.actions.getPagerDisplayState = function(){
                                return !!scope.vm.showPager;
                            };
                            /**
                             *  BIND EXERCISE
                             */
                            scope.actions.bindExerciseViewTo = znkExerciseDrvCtrl.bindExerciseViewTo;

                            scope.actions.unbindExerciseView = znkExerciseDrvCtrl.unbindExerciseView;
                            /**
                             *  END BIND EXERCISE
                             */

                            /**
                             *  ACTIONS END
                             * */

                            /**
                             *  RENDER AND SET VIEW VALUE
                             * */
                            function render(viewValue) {
                                allQuestionWithAnswersArr = viewValue;
                                scope.vm.questionsWithAnswers = allQuestionWithAnswersArr;
                            }

                            ngModelCtrl.$render = function () {
                                render(ngModelCtrl.$viewValue);
                            };

                            function setViewValue() {
                                ngModelCtrl.$setViewValue(scope.vm.questionsWithAnswers);
                            }
                            /**
                             *  RENDER AND SET VIEW VALUE END
                             * */

                            function getCurrentQuestion() {
                                return allQuestionWithAnswersArr[scope.vm.currentSlide];
                            }

                            /**
                             *  TOOL BOX MODAL
                             * */
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
                                                scope.vm.hidePager = true;
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
                                                scope.vm.hidePager = false;
                                            }
                                            break;
                                    }
                                    setViewValue();
                                },
                                onToolValueChanged: function (evt) {
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BOOKMARK:
                                            scope.vm.bookmarkCurrentQuestion();
                                            break;
                                    }
                                    setViewValue();
                                }
                            };
                            var toolBoxModalInstance = ZnkExerciseSrv.openExerciseToolBoxModal(toolboxModalSettings);
                            /**
                             *  TOOL BOX MODAL END
                             * */

                            /**
                             *  FORMATTER & PARSER
                             * */
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

                                    questionCopy.__questionStatus= answer;
                                    questionCopy.__questionStatus.index = index;

                                    return questionCopy;
                                });
                                return questionsWithAnswers;
                            };
                            ngModelCtrl.$formatters.push(questionAnswersToOneObjectfmtr.formatter);

                            questionAnswersToOneObjectfmtr.parser = function (questionsWithAnswersArr) {
                                scope.vm.answeredCount  = 0;

                                var results = ngModelCtrl.$modelValue || [];

                                questionsWithAnswersArr.forEach(function (questionWithAnswer, index) {
                                    if (angular.isUndefined(questionWithAnswer.__questionStatus)) {
                                        return;
                                    }

                                    var answer = angular.copy(questionWithAnswer.__questionStatus);
                                    answer.questionId = questionWithAnswer.id;

                                    if (angular.isDefined(answer.userAnswer)) {
                                        scope.vm.answeredCount ++;
                                    }

                                    results[index] = answer;
                                });

                                return results;
                            };
                            ngModelCtrl.$parsers.push(questionAnswersToOneObjectfmtr.parser);
                            /**
                             *  FORMATTER & PARSER END
                             * */

                            scope.vm.questionAnswered = function () {
                                if (scope.settings.viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    var currQuestion = getCurrentQuestion();
                                    var userAnswer = currQuestion.__questionStatus.userAnswer;
                                    currQuestion.__questionStatus.isAnsweredCorrectly = ZnkExerciseUtilitySrv.isAnswerCorrect(currQuestion,userAnswer);

                                    updateTimeSpentOnQuestion(undefined,true);
                                    var afterAllowedTime = _isExceededAllowedTime();
                                    currQuestion.__questionStatus.afterAllowedTime = afterAllowedTime;
                                    setViewValue();
                                }
                                scope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, getCurrentQuestion());
                                //skip 1 digest cycle before triggering question answered
                                $timeout(function(){
                                    scope.settings.onQuestionAnswered(scope.vm.currentSlide);
                                });
                            };

                            scope.vm.bookmarkCurrentQuestion = function () {
                                var currQuestion = getCurrentQuestion();
                                currQuestion.__questionStatus.bookmark = !currQuestion.__questionStatus.bookmark;
                                scope.$broadcast(ZnkExerciseEvents.BOOKMARK, currQuestion);
                                setViewValue();
                            };

                            function updateTimeSpentOnQuestion(questionNum, dontSetViewValue) {
                                questionNum = angular.isDefined(questionNum) ? questionNum : scope.vm.currentSlide;
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
                                var question = scope.vm.questionsWithAnswers[questionNum];
                                question.__questionStatus.timeSpent = (question.__questionStatus.timeSpent || 0) + timePassed;

                                if(!dontSetViewValue){
                                    setViewValue();
                                }
                            }

                            function _isExceededAllowedTime(){
                                var totalTimeSpent = 0;
                                scope.vm.questionsWithAnswers.forEach(function(questionWithAnswer){
                                    totalTimeSpent += questionWithAnswer.__questionStatus.timeSpent || 0;
                                });
                                var allowedTime = scope.settings.allowedTimeForExercise;
                                return totalTimeSpent > allowedTime;
                            }
                            /**
                             *  INIT
                             * */

                            scope.actions.setSlideDirection(scope.settings.initSlideDirection);

                            scope.actions.forceDoneBtnDisplay(scope.settings.initForceDoneBtnDisplay);

                            scope.actions.pagerDisplay(scope.settings.initPagerDisplay);

                            /**
                             *  INIT END
                             * */

                            /**
                             * EXERCISE CTRL ADDITIONAL API
                             */

                            znkExerciseDrvCtrl.setViewValue = setViewValue;

                            /**
                             * EXERCISE CTRL ADDITIONAL END
                             */

                            scope.$watch('vm.currentSlide', function (value, prevValue) {
                                if(angular.isUndefined(value)){
                                    return;
                                }

                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    updateTimeSpentOnQuestion(prevValue);
                                    var currQuestion = getCurrentQuestion();
                                    scope.settings.onSlideChange(currQuestion, value);
                                    scope.$broadcast(ZnkExerciseEvents.QUESTION_CHANGED,value ,prevValue ,currQuestion);
                                });

                                //var url = $location.url() + '/' + scope.vm.questionsWithAnswers[value].id;
                                //$analytics.pageTrack(url);
                            });

                            scope.$watch('vm.questionsWithAnswers.length',function(newNum,oldNum){
                                scope.$broadcast(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED,newNum,oldNum);
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


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseDrvCtrl', [
        '$scope', '$q', 'ZnkExerciseEvents', '$log', '$element', 'ZnkExerciseSrv', 'UtilitySrv', 'ENV',
        function ($scope, $q, ZnkExerciseEvents, $log, $element, ZnkExerciseSrv, UtilitySrv, ENV) {
            var self = this;

            var questionReadyDefer = $q.defer();
            var btnSectionReadyDefer = $q.defer();

            var exerciseReadyProm = $q.all([
                questionReadyDefer.promise,
                btnSectionReadyDefer.promise
            ]);

            exerciseReadyProm.then(function(){
                $scope.$broadcast(ZnkExerciseEvents.READY);
                if ($scope.settings.onExerciseReady) {
                    $scope.settings.onExerciseReady();
                }
            });

            function isQuestionAnswered(index) {
                var questionWithAnswer = $scope.vm.questionsWithAnswers ? $scope.vm.questionsWithAnswers[index] : {};
                return questionWithAnswer && questionWithAnswer.__questionStatus && angular.isDefined(questionWithAnswer.__questionStatus.userAnswer);
            }

            function canChangeQuestion(requiredIndex, currIndex){
                var promArr = [];
                changeQuestionResolvers.forEach(function(resolver){
                    var getResolverResult = $q.when(angular.isFunction(resolver ) ? resolver(requiredIndex, currIndex) : resolver);
                    promArr.push(getResolverResult);
                });
                return $q.all(promArr);
            }

            self.isExerciseReady = function(){
                return exerciseReadyProm;
            };

            self.getViewMode = function () {
                return $scope.settings.viewMode;
            };

            self.getSlideDirection = function () {
                return $scope.settings.slideDirection;
            };

            var changeQuestionResolvers = [];
            self.addQuestionChangeResolver = function(resolver){
                changeQuestionResolvers.push(resolver);
            };

            self.removeQuestionChangeResolver = function(resolver){
                var newChangeQuestionResolvers = [];
                changeQuestionResolvers.forEach(function(resolverItem){
                    if(resolverItem !== resolver){
                        newChangeQuestionResolvers.push(resolverItem);
                    }
                });
                changeQuestionResolvers = newChangeQuestionResolvers;
            };

            self.getCurrentIndex = function () {
                return $scope.vm.currentSlide;
            };

            self.setCurrentIndex = function (newQuestionIndex) {
                if (angular.isDefined(newQuestionIndex)) {
                    var currIndex = self.getCurrentIndex();
                    return canChangeQuestion(newQuestionIndex, currIndex).then(function () {
                        //max index limit
                        var questions = $scope.questionsGetter() || [];
                        newQuestionIndex = Math.min(newQuestionIndex, questions.length - 1);

                        //minimum index limit
                        newQuestionIndex = Math.max(0, newQuestionIndex);

                        $scope.vm.currentSlide = newQuestionIndex;

                        if(self.__exerciseViewBinding){
                            self.__exerciseViewBinding.currSlideIndex = newQuestionIndex;
                        }

                        return $scope.vm.currentSlide;
                    });
                }else{
                    $log.debug('ZnkExerciseDrv: setCurrentIndex was invoked with undefined newQuestionIndex parameter');
                }
                return $q.when($scope.vm.currentSlide);
            };

            self.setCurrentIndexByOffset = function (offset) {
                var currIndex = this.getCurrentIndex();
                var newCurrIndex = currIndex + offset;
                return this.setCurrentIndex(newCurrIndex);
            };

            self.notifyQuestionBuilderReady = function () {
                questionReadyDefer.resolve();
            };

            self.notifyBtnSectionReady = function(){
                btnSectionReadyDefer.resolve();
            };

            self.isCurrentQuestionAnswered = function () {
                return isQuestionAnswered($scope.vm.currentSlide);
            };

            self.isLastUnansweredQuestion = function(){
                var questionsNum = ($scope.vm.questionsWithAnswers || []).length;
                var unansweredNum = 0;
                for(var i=0; i<questionsNum; i++){
                    if(!isQuestionAnswered(i)){
                        unansweredNum++;
                        if(unansweredNum === 2){
                            return false;
                        }
                    }
                }
                return unansweredNum === 1;
            };

            self.getQuestions = function(){
                return questionReadyDefer.promise.then(function(){
                    return $scope.vm.questionsWithAnswers;
                });
            };

            self.areAllQuestionsAnswered = function() {
                var answeredCount = self.answeredCount;
                return self.getQuestions().then(function(questions) {
                    return answeredCount === questions.length;
                });
            };

            self.getElement = function(){
                return $element;
            };

            self.getCurrentQuestion = function(){
                return self.getQuestions().then(function(questions){
                    var currIndex = self.getCurrentIndex();
                    return questions[currIndex];
                });
            };
            /**
             *  bind exercise
             *  BindExerciseEventManager: use the registerCb and update in directives
             *    update: update the bind object in firebase that something change
             *    registerCb: register callback to sync data after update
             *    trigger: internally when the watch update the trigger fires
             */
            (function(self) {

                self.updatedBy = ENV.appContext;
                // initial an empty object in case bindExerciseViewTo was not called
                self.__exerciseViewBinding = {};

                function BindExerciseEventManager() {
                    this.cbObj = {};
                }

                BindExerciseEventManager.prototype.trigger = function(key, value) {
                    if (angular.isArray(this.cbObj[key])) {
                        this.cbObj[key].forEach(function (obj) {
                            if (obj.id && value.id && value.updatedBy && self.updatedBy) {
                                if (obj.id === value.id && self.updatedBy !== value.updatedBy) {
                                    obj.cb(value);
                                }
                            } else if (obj.id && value.id) {
                                if (obj.id === value.id) {
                                    obj.cb(value);
                                }
                            } else if (self.updatedBy && value.updatedBy) {
                                if (self.updatedBy !== value.updatedBy) {
                                    obj.cb(value);
                                }
                            } else {
                                obj.cb(value);
                            }
                        }, this);
                    }
                };

                BindExerciseEventManager.prototype.update = function(key, valueObj, id) {
                    if (!angular.isObject(valueObj) || angular.isArray(valueObj) && valueObj !== null) {
                        $log.error('ZnkExerciseDrvCtrl BindExerciseEventManager: value that pass to update function must be an object ie: {}');
                        return;
                    }

                    var curValue = self.__exerciseViewBinding[key] || {};

                    if (id) {
                        curValue.id = id;
                    }

                    if (self.updatedBy) {
                        curValue.updatedBy = self.updatedBy;
                    }

                    // create new guid for each update to enforce it
                    valueObj.update = UtilitySrv.general.createGuid();

                    curValue = angular.extend({}, curValue, valueObj);

                    self.__exerciseViewBinding[key] = curValue;
                };

                BindExerciseEventManager.prototype.registerCb = function(key, cb, id) {
                     if (!angular.isArray(this.cbObj[key])) {
                         this.cbObj[key] = [];
                     }
                     this.cbObj[key].push({ id: id, cb: cb });
                };

                self.bindExerciseEventManager = new BindExerciseEventManager();

                var exerciseViewListenersObj =  {};

                var keys = ZnkExerciseSrv.getBindExerciseKeys();

                self.bindExerciseViewTo = function (exerciseView) {
                    if(!angular.isObject(exerciseView) || !angular.isArray(keys)) {
                        $log.error('ZnkExerciseDrvCtrl bindExerciseViewTo: exercise view should be an object or keys should be an array');
                        return;
                    }

                    self.__exerciseViewBinding = exerciseView;

                    angular.forEach(keys, function (keyObj) {
                        exerciseViewListenersObj[keyObj.getterName] = $scope.$watchCollection(function () {
                            return exerciseView[keyObj.getterName];
                        },function (newVal) {
                            if (angular.isDefined(newVal)) {
                                if (keyObj.setterName) {
                                    self[keyObj.setterName](newVal);
                                } else {
                                    self.bindExerciseEventManager.trigger(keyObj.getterName, newVal);
                                }
                            }
                        });
                    });
                };

                self.unbindExerciseView = function (keyNameObj) {
                    angular.forEach(exerciseViewListenersObj, function(fn, key) {
                        if (!keyNameObj || keyNameObj[key]) {
                            exerciseViewListenersObj[key]();
                            exerciseViewListenersObj[key] = null;
                        }
                    });

                    var cleanExerciseViewBinding = true;

                    for (var i in exerciseViewListenersObj) {
                        if (exerciseViewListenersObj.hasOwnProperty(i) && exerciseViewListenersObj[i] !== null) {
                            cleanExerciseViewBinding = false;
                            break;
                        }
                    }

                    if (self.__exerciseViewBinding && cleanExerciseViewBinding){
                        self.__exerciseViewBinding = null;
                    }
                };

            })(self);
        }]);
})(angular);

/**
 * attrs:
 *  questions
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
        '$timeout', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum', 'QuestionTypesSrv',
        function ($timeout, ZnkExerciseEvents, ZnkExerciseViewModeEnum, QuestionTypesSrv) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExercisePagerDrv.html',
                restrict: 'E',
                require: ['ngModel', '^znkExercise'],
                scope: {
                    questions: '<'
                },
                link: {
                    pre: function (scope, element, attrs, ctrls) {
                        var ngModelCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var currViewMode = znkExerciseCtrl.getViewMode();

                        var domElement = element[0];

                        scope.d = {};

                        scope.d.tap = function (newIndex) {
                            znkExerciseCtrl.setCurrentIndex(newIndex);
                        };

                        function getPagerItemByIndex(index) {
                            return angular.element(domElement.querySelectorAll('.pager-item')[index]);
                        }

                        function setPagerItemBookmarkStatus(index, status) {
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
                            if (status) {
                                pagerItemElement.addClass('bookmark');
                            } else {
                                pagerItemElement.removeClass('bookmark');
                            }
                        }

                        function setPagerItemAnswerClassValidAnswerWrapper(question, index) {
                            var userAnswer = question.__questionStatus.userAnswer;
                            var answerTypeId = question.answerTypeId;
                            var currIndex = index || question.__questionStatus.index;
                            
                            QuestionTypesSrv.checkAnswerAgainstFormatValidtors(userAnswer, answerTypeId, function() {               
                                setPagerItemAnswerClass(currIndex, question); 
                            }, function() {
                                 var pagerItemElement = getPagerItemByIndex(currIndex);
                                 pagerItemElement.removeClass('neutral correct wrong');  
                            }, question);
                        }

                        function setPagerItemAnswerClass(index, question) {
                            var pagerItemElement = getPagerItemByIndex(index);

                            if (angular.isUndefined(question.__questionStatus.userAnswer)) {
                                pagerItemElement.removeClass('neutral correct wrong');
                                return;
                            }

                            if (currViewMode === ZnkExerciseViewModeEnum.ONLY_ANSWER.enum || question.manualEvaluation) {
                                pagerItemElement.addClass('neutral');
                                return;
                            }

                            if (question.__questionStatus.isAnsweredCorrectly) {
                                pagerItemElement.addClass('correct');
                            } else {
                                pagerItemElement.addClass('wrong');
                            }
                        }

                        ngModelCtrl.$render = function () {
                            var currentSlide = +ngModelCtrl.$viewValue;
                            if (isNaN(currentSlide)) {
                                return;
                            }
                            //added in order to prevent the swipe lag
                            $timeout(function () {
                                var i;
                                var $pagerItemWithCurrentClass = angular.element(domElement.querySelectorAll('.pager-item.current'));
                                for (i in $pagerItemWithCurrentClass) {
                                    $pagerItemWithCurrentClass.eq(i).removeClass('current');
                                }
                                var pagerItemsDomElement = domElement.querySelectorAll('.pager-item');
                                var currentSlideDom = angular.element(pagerItemsDomElement[currentSlide]);
                                currentSlideDom.addClass('current');

                                for (i in scope.questions) {
                                    var question = scope.questions[i];
                                    setPagerItemBookmarkStatus(i, question.__questionStatus.bookmark);
                                    setPagerItemAnswerClassValidAnswerWrapper(question, i);
                                }
                            });
                        };

                        scope.$on(ZnkExerciseEvents.BOOKMARK, function (evt, question) {
                            setPagerItemBookmarkStatus(question.__questionStatus.index, question.__questionStatus.bookmark);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function (evt, question) {
                            setPagerItemAnswerClassValidAnswerWrapper(question);
                        });

                        function init() {
                            //wait for the pager items to be rendered
                            $timeout(function () {
                                ngModelCtrl.$render();
                            }, false);
                        }

                        scope.$watch(function () {
                            var questions = scope.questions;

                            if (!questions) {
                                questions = [];
                            }

                            var watchExpr = '';
                            questions.forEach(function (question) {
                                watchExpr += +(!!(question.__questionStatus && question.__questionStatus.userAnswer));
                            });
                            return watchExpr;
                        }, function (newVal, oldVal) {
                            if (!angular.equals(newVal, oldVal)) {
                                init();
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseToolBox',
        function () {
            'ngInject';

            return {
                templateUrl: 'components/znkExercise/toolbox/core/znkExerciseToolBoxDirective.template.html',
                require: '^znkExercise',
                scope:{
                    settings: '<'
                },
                controllerAs: '$ctrl',
                controller: ["$element", function($element){
                    'ngInject';// jshint ignore: line

                    this.getCurrentQuestion = function(){
                        return this.znkExerciseCtrl.getCurrentQuestion();
                    };

                    this.getZnkExerciseElement = function(){
                        return $element.parent();
                    };

                    this.isExerciseReady = function(){
                        return this.znkExerciseCtrl.isExerciseReady();
                    };
                }],
                bindToController: true,
                link: {
                    pre: function(scope, element, attrs, znkExerciseCtrl){
                        scope.$ctrl.znkExerciseCtrl = znkExerciseCtrl;
                    }
                }
            };
        }
    );
})(angular);


/**
 * This service serves as a communication tool between znkExerciseDrawContainer and znkExerciseDrawTool
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').service('ZnkExerciseDrawSrv',
        function () {
            //'ngInject';
            
            var self = this;

            /** example of self.canvasContextManager
             *  {
             *      10981: {
             *                question: CanvasContextObject,
             *                answer: CanvasContextObject
             *             },
             *      10982: {
             *                question: CanvasContextObject,
             *                answer: CanvasContextObject
             *             }
             *  } 
             *
             *  the names (such as 'question' or 'answer') are set according to the attribute name 'canvas-name' of znkExerciseDrawContainer directive
             */

            self.canvasContextManager = {};

            // addCanvasToElement function is to be added into this service as well. see znkExerciseDrawContainer directive

        });

})(angular);



'use strict';

(function () {

    angular.module('znk.infra.znkExercise').directive('blackboardDrv', [
        'GoBackHardwareSrv',
        function (GoBackHardwareSrv) {

            return {
                restric: 'EA',
                scope: {
                    drawingData: '=',
                    actions: '&',
                    close: '&'
                },
                replace: true,
                templateUrl: 'scripts/exercise/templates/blackboardDrv.html',
                link: function (scope, elem) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    function activatePen() {
                        scope.d.activeDrawMode = drawModes.pen;
                    }

                    function activateEraser() {
                        scope.d.activeDrawMode = drawModes.eraser;
                    }

                    function clearCanvas() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        scope.drawingData.dataUrl = null;
                    }

                    var actions = scope.actions() || {};
                    angular.extend(actions, {
                        activatePen: activatePen,
                        activateEraser: activateEraser,
                        clear: clearCanvas
                    });

                    var drawModes = {
                        pen: 1,
                        eraser: 2
                    };

                    scope.d = {
                        drawModes: drawModes,
                        activeDrawMode: drawModes.pen
                    };

                    var _lastX,
                        _lastY;

                    var canvas = elem.find('canvas')[0];
                    canvas.width = elem[0].offsetWidth;
                    canvas.height = elem[0].offsetHeight;

                    var ctx = canvas.getContext('2d');

                    function serialize(canvas) {
                        return canvas.toDataURL();
                    }
                    function deserialize(data, canvas) {
                        var img = new Image();
                        img.onload = function() {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            canvas.getContext('2d').drawImage(img, 0, 0);
                        };

                        img.src = data;
                    }

                    if (scope.drawingData.dataUrl) {
                        deserialize(scope.drawingData.dataUrl, canvas);
                    }

                    function onTouchStart(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        _lastX = e.targetTouches[0].pageX;
                        _lastY = e.targetTouches[0].pageY;

                        draw(_lastX + 1, _lastY + 1);
                    }

                    function onTouchMove(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var curX = e.targetTouches[0].pageX;
                        var curY = e.targetTouches[0].pageY;

                        draw(curX, curY);

                        _lastX = curX;
                        _lastY = curY;
                    }

                    function onTouchEnd(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        scope.drawingData = scope.drawingData || {};
                        scope.drawingData.dataUrl = serialize(canvas);
                    }

                    function draw(x, y) {
                        ctx.beginPath();
                        if (scope.d.activeDrawMode === drawModes.pen) {
                            ctx.globalCompositeOperation = 'source-over';
                            ctx.strokeStyle = '#FFFFFF';
                            ctx.lineWidth = 4;
                            ctx.moveTo(_lastX, _lastY);
                            ctx.lineTo(x, y);
                            ctx.stroke();
                        } else if (scope.d.activeDrawMode === drawModes.eraser) {
                            ctx.globalCompositeOperation = 'destination-out';
                            ctx.arc(_lastX, _lastY, 16, 0, Math.PI * 2, false);
                            ctx.fill();
                        }
                    }

                    canvas.addEventListener('touchstart', onTouchStart);
                    canvas.addEventListener('touchmove', onTouchMove);
                    canvas.addEventListener('touchend', onTouchEnd);

                    scope.$on('$destroy', function () {
                        canvas.removeEventListener('touchstart', onTouchStart);
                        canvas.removeEventListener('touchmove', onTouchMove);
                        canvas.removeEventListener('touchend', onTouchEnd);
                    });
                }
            };
        }]);
})();

'use strict';

/*globals math */
(function(angular) {

    angular.module('znk.infra.znkExercise').directive('calculator', [
        'GoBackHardwareSrv',
        function(GoBackHardwareSrv) {
            var cos = math.cos;
            var sin = math.sin;
            var tan = math.tan;

            return {
                scope :{
                    calcTop: '=',
                    close: '&'
                },
                link: function (scope) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    math.cos = function (x) {
                        return cos(math.unit(x, scope.trigunits));
                    };

                    math.sin = function (x) {
                        return sin(math.unit(x, scope.trigunits));
                    };

                    math.tan = function (x) {
                        return tan(math.unit(x, scope.trigunits));
                    };
                    scope.onClickAns = function () {
                        if (scope.result !== 'ERR') {
                            scope.expression =  scope.result;
                        }
                    };
                    scope.onClickNum = function (n) {
                        scope.expression += String(n);
                    };

                    scope.onClickAdd = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }

                        scope.expression += ' + ';
                    };

                    scope.onClickSubtract = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' - ';
                    };

                    scope.onClickMultiply = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' * ';
                    };

                    scope.onClickDivide = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' / ';
                    };

                    scope.onClickClear = function () {
                        scope.expression = '';
                        scope.result = 0;
                    };

                    scope.onClickDot = function () {
                        scope.expression += '.';
                    };

                    scope.onClickPi = function () {
                        scope.expression += ' pi ';
                    };

                    scope.onClickE = function () {
                        scope.expression += ' e ';
                    };

                    scope.onClickRad = function () {
                        scope.trigunits = 'rad';
                    };

                    scope.onClickDeg = function () {
                        scope.trigunits = 'deg';
                    };

                    scope.onClickSin = function () {
                        scope.expression += ' sin(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCos = function () {
                        scope.expression += ' cos(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickTan = function () {
                        scope.expression += ' tan(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickSqr = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^2 ';
                    };

                    scope.onClickPowThree = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^3 ';
                    };

                    scope.onClickPow = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^ ';
                    };

                    scope.onClickSqrt = function () {
                        scope.expression += ' sqrt(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickInv = function () {
                        scope.expression += ' inv(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickAbs = function () {
                        scope.expression += ' abs(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickFact = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += '! ';
                    };

                    scope.onClickLog = function () {
                        scope.expression += ' log(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickLn = function () {
                        scope.expression += ' ln(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickOpenParen = function () {
                        scope.expression += '(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCloseParen = function () {
                        scope.expression += ')';
                    };

                    scope.onClickUndo = function () {
                       scope.expression = scope.expression.trimRight();
                       scope.expression = scope.expression.substring(0, scope.expression.length - 1);
                    };

                    scope.onClickEqual = function () {
                        var exp = scope.expression.
                            replace('log', 'log10').
                            replace('ln', 'log');
                        try {
                            scope.result = math.round(math.eval(exp), 5);
                        } catch (err) {
                            try {
                                // best effort in case of missing one paren
                                exp += ')';
                                scope.result = math.round ( math.eval ( exp ), 5 );
                            } catch (err) {
                                scope.result = 'ERR';
                            }
                        }
                        scope.expression = '';
                    };

                    scope.onClickMPlus = function () {
                        scope.mem += scope.result;
                    };

                    scope.onClickMc = function () {
                        scope.mem = 0;
                    };

                    scope.onClickMR = function () {
                        scope.expression += scope.mem;
                    };

                    scope.hasMemory = function () {
                        return scope.mem > 0;
                    };

                    var init = function init () {
                        scope.result = 0;
                        scope.expression = '';
                        scope.mem = 0;
                        scope.trigunits = 'rad';
                    };
                    init();
                },
                templateUrl: 'scripts/exercise/templates/calculator.html'
            };
    }]);

}(angular));


/**
 * This directive is bound to elements requesting a canvas to cover them
 * since the canvas is positioned as 'absolute', the directive also sets a 'relative' position to relate to the canvas
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawContainer',
        ["ZnkExerciseDrawSrv", function (ZnkExerciseDrawSrv) {
            //'ngInject';

            return {
                require: '^questionBuilder',
                link: function (scope,element,attrs, questionBuilderCtrl) {

                    var question = questionBuilderCtrl.question;

                    // make the canvas container relative to this element
                    if (element.css('position') !== 'relative') {
                        element.css('position', 'relative');
                        // sometimes position relative adds an unnecessary scrollbar. hide it
                        element.css('overflow-x', 'hidden');
                    }
                    ZnkExerciseDrawSrv.addCanvasToElement(element,question);
                }
            };

        }]);

})(angular);




/**
 * attrs:
 *  settings:
 *      exerciseDrawingPathPrefix
 *      toucheColorId
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawTool',
        ["ZnkExerciseEvents", "ZnkExerciseDrawSrv", "InfraConfigSrv", "$log", "$q", "$compile", "$timeout", "$window", function (ZnkExerciseEvents, ZnkExerciseDrawSrv, InfraConfigSrv, $log, $q, $compile, $timeout, $window) {
            'ngInject';

            var TOUCHE_COLORS = {
                0: 0,// deleted
                1: '#0072bc',
                2: '#af667d'
            };

            return {
                templateUrl: 'components/znkExercise/toolbox/tools/draw/znkExerciseDrawToolDirective.template.html',
                require: '^znkExerciseToolBox',
                scope: {
                    settings: '<'
                },
                link: function (scope, element, attrs, toolBoxCtrl) {
                    var canvasDomElement,
                        canvasContext,
                        canvasContainerElementInitial,
                        drawer,
                        eventsManager,
                        serverDrawingUpdater,
                        currQuestion;

                    var PIXEL_SIZE = 2;
                    var SERVER_UPDATED_FLUSH_TIME = 0;

                    var DRAWING_MODES = {
                        'NONE': 1,
                        'VIEW': 2,
                        'VIEW_DRAW': 3,
                        'VIEW_ERASE': 4
                    };

                    var TOOLS = {
                        TOUCHE: 1,
                        PENCIL: 2,
                        ERASER: 3
                    };

                    scope.d = {};

                    scope.d.DRAWING_MODES = DRAWING_MODES;

                    scope.d.TOOLS = TOOLS;

                    scope.d.toolClicked = function (tool) {
                        if (!currQuestion) {
                            $log.debug('znkExerciseDrawTool: curr question was not set yet');
                            return;
                        }

                        switch (tool) {
                            case TOOLS.TOUCHE:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.NONE ? DRAWING_MODES.VIEW : DRAWING_MODES.NONE;
                                break;
                            case TOOLS.PENCIL:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.VIEW_DRAW ? DRAWING_MODES.VIEW : DRAWING_MODES.VIEW_DRAW;
                                break;
                            case TOOLS.ERASER:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.VIEW_ERASE ? DRAWING_MODES.VIEW : DRAWING_MODES.VIEW_ERASE;
                                break;
                        }
                    };

                    function _getFbRef(currQuestionId, canvasContextName) {
                        var errMsg;

                        if (!scope.settings || !scope.settings.exerciseDrawingPathPrefix) {
                            errMsg = 'znkExerciseDrawTool';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }

                        if (!currQuestionId) {
                            errMsg = 'znkExerciseDrawTool:_getFbRef: curr question was not set yet';
                            $log.debug(errMsg);
                            return $q.reject(errMsg);
                        }

                        var pathPrefixProm;
                        if (angular.isFunction(scope.settings.exerciseDrawingPathPrefix)) {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix();
                        } else {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix;
                        }

                        var dataPromMap = {
                            globalStorage: InfraConfigSrv.getGlobalStorage(),
                            pathPrefix: $q.when(pathPrefixProm)
                        };

                        return $q.all(dataPromMap).then(function (data) {
                            var path = 'exerciseDrawings/' + data.pathPrefix + '/' + currQuestionId + '/' + canvasContextName;
                            return data.globalStorage.adapter.getRef(path);
                        });

                    }

                    function _getCanvasContextByContextName(canvasContextName) {
                        return ZnkExerciseDrawSrv.canvasContextManager[currQuestion.id][canvasContextName];
                    }

                    function _getCanvasContextNamesOfQuestion(questionId) {
                        var canvasContextObj = ZnkExerciseDrawSrv.canvasContextManager[questionId] || {};
                        return Object.keys(canvasContextObj);
                    }

                    scope.d.cleanCanvas = function () {
                        if (!currQuestion) {
                            var errMsg = 'znkExerciseDrawTool:_getFbRef: curr question was not set yet';
                            $log.error(errMsg);
                            return;
                        }

                        // for each canvas in the current page (the current question), set the global canvasContext to it and clear it using drawer.clean()
                        var canvasContextNames = _getCanvasContextNamesOfQuestion(currQuestion.id);
                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            canvasContext = _getCanvasContextByContextName(canvasContextName);
                            drawer.clean();
                            _getFbRef(currQuestion.id, canvasContextName).then(function (exerciseDrawingRef) {
                                exerciseDrawingRef.set(null);
                            });

                        });
                    };


                    function _getToucheColor(drawMode) {
                        if (drawMode === DRAWING_MODES.VIEW_ERASE) {
                            return 0;
                        }

                        if (!scope.settings || angular.isUndefined(scope.settings.toucheColorId)) {
                            $log.debug('znkExerciseDrawTool: touche color was not set');
                            return 1;
                        }

                        return scope.settings.toucheColorId;
                    }

                    function _setDrawMode(drawMode) {
                        switch (drawMode) {
                            case DRAWING_MODES.NONE:
                                eventsManager.cleanQuestionListeners();
                                drawer.clean();
                                break;
                            case DRAWING_MODES.VIEW:
                                eventsManager.killMouseEvents();
                                eventsManager.registerFbListeners(currQuestion.id);
                                break;
                            default:
                                eventsManager.registerMouseEvents();
                                eventsManager.registerFbListeners(currQuestion.id);
                                drawer.toucheColor = _getToucheColor(drawMode);
                        }
                    }

                    function ServerDrawingUpdater(questionUid, canvasContextName) {
                        if (angular.isUndefined(questionUid)) {
                            $log.error('znkExerciseDrawTool: Question id was not provided');
                            return;
                        }

                        this.pixelsMapToUpdate = {};

                        this.exerciseDrawingRefProm = _getFbRef(questionUid, canvasContextName);
                    }

                    ServerDrawingUpdater.prototype._triggerServerUpdate = function () {
                        if (this.alreadyTriggered) {
                            return;
                        }

                        this.alreadyTriggered = true;

                        var self = this;
                        $timeout(function () {
                            self.alreadyTriggered = false;
                            self.flush();
                        }, SERVER_UPDATED_FLUSH_TIME, false);
                    };

                    ServerDrawingUpdater.prototype.update = function (pixelsMapToUpdate) {
                        angular.extend(this.pixelsMapToUpdate, pixelsMapToUpdate);
                        this._triggerServerUpdate();
                    };

                    ServerDrawingUpdater.prototype.flush = function () {
                        var self = this;

                        return this.exerciseDrawingRefProm.then(function (exerciseDrawingRef) {
                            exerciseDrawingRef.child('coordinates').update(self.pixelsMapToUpdate);
                            self.pixelsMapToUpdate = {};
                        });
                    };

                    function Drawer() {
                        this.lastPoint = null;
                    }

                    Drawer.prototype.drawPixel = function (coordStr, colorId, canvasToChange) {
                        if (!canvasContext && !canvasToChange) {
                            return;
                        }

                        // relevant canvas can be either passed to the function or be the global one
                        canvasToChange = canvasToChange || canvasContext;

                        var coords = coordStr.split(":");
                        $window.requestAnimationFrame(function () {
                            canvasToChange.fillStyle = TOUCHE_COLORS[colorId];
                            canvasToChange.fillRect(parseInt(coords[0]), parseInt(coords[1]), PIXEL_SIZE, PIXEL_SIZE);
                        });
                    };

                    Drawer.prototype.clearPixel = function (coordStr, canvasToChange) {
                        if (!canvasContext && !canvasToChange) {
                            return;
                        }

                        // relevant canvas can be either passed to the function or be the global one
                        canvasToChange = canvasToChange || canvasContext;

                        var coords = coordStr.split(":");

                        $window.requestAnimationFrame(function () {
                            var xCoord = parseInt(coords[0]);
                            var yCoord = parseInt(coords[1]);
                            var width = 10 * PIXEL_SIZE;
                            var height = 10 * PIXEL_SIZE;
                            var xOffset = width/2;
                            var yOffset = height/2;
                            canvasToChange.clearRect(xCoord - xOffset, yCoord - yOffset, width, height);
                        });
                    };

                    Drawer.prototype.draw = function (e) {
                        var self = this;

                        var currXCoor = e.offsetX;
                        var currYCoor = e.offsetY;

                        var prevXCoor = self.lastPoint ? self.lastPoint[0] : currXCoor - 1;
                        var prevYCoor = self.lastPoint ? self.lastPoint[1] : currYCoor - 1;

                        self.lastPoint = [currXCoor, currYCoor];

                        var xDiff = Math.abs(currXCoor - prevXCoor);
                        var yDiff = Math.abs(currYCoor - prevYCoor);

                        var pixelsNumToDraw = Math.max(xDiff, yDiff);
                        var xStepOffset = xDiff / pixelsNumToDraw;
                        var yStepOffset = yDiff / pixelsNumToDraw;
                        var pixelsToDrawMap = {};
                        for (var i = 1; i <= pixelsNumToDraw; i++) {
                            var pixelXOffset = (currXCoor - prevXCoor > 0) ? 1 : -1;
                            pixelXOffset *= Math.round(i * xStepOffset);

                            var pixelYOffset = (currYCoor - prevYCoor > 0) ? 1 : -1;
                            pixelYOffset *= Math.round(i * yStepOffset);

                            var pixelToDrawXCoor = Math.round(prevXCoor + pixelXOffset);
                            var pixelToDrawYCoor = Math.round(prevYCoor + pixelYOffset);

                            pixelsToDrawMap[pixelToDrawXCoor + ':' + pixelToDrawYCoor] = self.toucheColor;
                        }

                        angular.forEach(pixelsToDrawMap, function (color, coordsStr) {
                            if (color) {
                                self.drawPixel(coordsStr, color);
                            } else {
                                self.clearPixel(coordsStr);
                            }
                        });

                        serverDrawingUpdater.update(pixelsToDrawMap);
                    };

                    Drawer.prototype.stopDrawing = function () {
                        this.lastPoint = null;
                    };

                    Drawer.prototype.clean = function () {
                        if (!canvasContext) {
                            return;
                        }
                        canvasContext.clearRect(0, 0, canvasDomElement.offsetWidth, canvasDomElement.offsetHeight);
                    };

                    function _mousemoveCb(evt) {
                        drawer.draw(evt);
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        return false;
                    }

                    function _mouseupCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            drawer.stopDrawing();
                            canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                            evt.stopImmediatePropagation();
                            evt.preventDefault();
                            return false;
                        }
                    }

                    function _mousedownCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            canvasDomElement.addEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.addEventListener('mouseup', _mouseupCb);
                            evt.stopImmediatePropagation();
                            evt.preventDefault();
                            return false;
                        }
                    }

                    function _updateQuestionDrawMode(drawMode) {
                        toolBoxCtrl.getCurrentQuestion().then(function (currQuestion) {
                            currQuestion.__questionStatus.drawingToolViewMode = drawMode;
                        });
                    }

                    scope.$watch('d.drawMode', function (newDrawMode) {
                        if (!newDrawMode) {
                            return;
                        }

                        _setDrawMode(newDrawMode);
                        _updateQuestionDrawMode(newDrawMode);
                    });

                    scope.$on('$destroy', function () {
                        eventsManager.cleanQuestionListeners();
                        eventsManager.cleanGlobalListeners();

                    });

                    function EventsManager() {
                        this._fbRegisterProm = $q.when();
                        this._fbCallbackEnum =
                            {
                                CHILD_CHANGED: 0,
                                CHILD_REMOVED: 1
                            };
                    }

                    EventsManager.prototype.registerHoverEvent = function (elementToHoverOn, onHoverCb) {
                        var domElementToHoverOn = elementToHoverOn[0];

                        domElementToHoverOn.addEventListener("mouseenter", onHoverCb);

                        if (!this._hoveredElements) {
                            this._hoveredElements = [];
                        }

                        this._hoveredElements.push({'hoveredElement' : elementToHoverOn, 'onHoverCb' : onHoverCb});
                    };


                    EventsManager.prototype.killHoverEvents = function() {
                        angular.forEach(this._hoveredElements, function (elementAndCbPair) {
                            var domHoveredElement = elementAndCbPair.hoveredElement[0];
                            domHoveredElement.removeEventListener("mouseenter", elementAndCbPair.onHoverCb);
                        });
                    };

                    EventsManager.prototype.registerMouseEvents = function () {
                        if (this._mouseEventsRegistered || !canvasDomElement) {
                            return;
                        }
                        this._mouseEventsRegistered = true;

                        canvasDomElement.addEventListener('mousedown', _mousedownCb);
                    };

                    EventsManager.prototype.killMouseEvents = function () {
                        if (this._mouseEventsRegistered) {
                            canvasDomElement.removeEventListener('mousedown', _mousedownCb);
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                            canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                        }
                        this._mouseEventsRegistered = null;
                    };

                    var _fbChildCallbackWrapper = function(canvasContextName, fbCallbackNum) {

                        function _fbChildChanged(snapShot) {
                            var canvasToChange = _getCanvasContextByContextName(canvasContextName); 
                            var coordsStr = snapShot.key();
                            var color = snapShot.val();

                            if (color === 0) {
                                drawer.clearPixel(coordsStr, canvasToChange);
                            } else {
                                drawer.drawPixel(coordsStr, color, canvasToChange);
                            }
                        }

                        function _fbChildRemoved(snapShot) {
                            var canvasToChange = _getCanvasContextByContextName(canvasContextName); // "this" refers to context passed to ref.on in registerFbListeners

                            var coordsStr = snapShot.key();
                            drawer.clearPixel(coordsStr, canvasToChange);
                        }

                        switch (fbCallbackNum) {
                                case eventsManager._fbCallbackEnum.CHILD_CHANGED:
                                    return _fbChildChanged;
                                case eventsManager._fbCallbackEnum.CHILD_REMOVED:
                                    return _fbChildRemoved;
                                default:
                                    $log.error('znkExerciseDrawTool:_fbChildCallbackWrapper: wrong fbCallbackNum received!');
                                    return;
                        }
                    };

                    EventsManager.prototype.registerFbListeners = function (questionId) {
                        if (angular.isUndefined(questionId)) {
                            $log.error('znkExerciseDrawTool:registerFbListeners: questionId was not provided');
                            return;
                        }

                        var self = this;

                        if (self._fbLastRegisteredQuestionId === questionId) {
                            return;
                        }
                        else {
                            self.killFbListeners();
                        }

                        var canvasContextNames = _getCanvasContextNamesOfQuestion(questionId);

                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            _getFbRef(questionId, canvasContextName).then(function (ref) {
                                self.ref = ref;

                                self.ref.child('coordinates').on("child_added", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').on("child_changed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').on("child_removed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_REMOVED));

                            });

                        });
                        self._fbLastRegisteredQuestionId = questionId;
                    };


                    EventsManager.prototype.killFbListeners = function () {
                        
                        var self = this;

                        var canvasContextNames = _getCanvasContextNamesOfQuestion(self._fbLastRegisteredQuestionId);
                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            _getFbRef(self._fbLastRegisteredQuestionId, canvasContextName).then(function (ref) {
                                self.ref = ref;

                                self.ref.child('coordinates').off("child_added", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').off("child_changed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').off("child_removed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_REMOVED));
                            });
                        });
                        self._fbLastRegisteredQuestionId = null;
                    };

                    EventsManager.prototype.cleanQuestionListeners = function () {
                        this.killMouseEvents();
                        this.killFbListeners();
                        this.killHoverEvents(); 
                    };

                    EventsManager.prototype.registerDimensionsListener = function(dimensionsRef, onValueCb) {
                        if (!this._dimensionsRefPairs) {
                            this._dimensionsRefPairs = [];
                        }
                        dimensionsRef.on('value', onValueCb);
                        this._dimensionsRefPairs.push({dimensionsRef : dimensionsRef, onValueCb: onValueCb});
                    };

                    EventsManager.prototype.killDimensionsListener = function() {
                        angular.forEach(this._dimensionsRefPairs, function (refAndCbPair) {
                            refAndCbPair.dimensionsRef.off("value",refAndCbPair.onValueCb);
                        });
                    };

                    EventsManager.prototype.cleanGlobalListeners = function() {
                        this.killDimensionsListener();
                    };

                    function _reloadCanvas() {
                        if (scope.d.drawMode === DRAWING_MODES.NONE) {
                            return;
                        }
                        eventsManager.registerFbListeners(currQuestion.id);
                    }

                    function _init() {
                        canvasContainerElementInitial = angular.element(
                            '<div class="draw-tool-container" ' +
                                'ng-show="d.drawMode !== d.DRAWING_MODES.NONE" ' +
                                'ng-class="{' +
                                '\'no-pointer-events\': d.drawMode === d.DRAWING_MODES.VIEW,' +
                                '\'crosshair-cursor\': d.drawMode !== d.DRAWING_MODES.NONE && d.drawMode !== d.DRAWING_MODES.VIEW' +
                                '}">' +
                                '<canvas></canvas>' +
                                '</div>'
                        );

                        drawer = new Drawer();
                        eventsManager = new EventsManager();
                    }

                    function _setContextOnHover(elementToHoverOn, canvasOfElement, canvasContextName) {
                        
                        var onHoverCb = function () {
                            if (currQuestion) {
                                drawer.stopDrawing();
                                eventsManager.killMouseEvents();

                                canvasDomElement = canvasOfElement;
                                canvasContext = canvasDomElement.getContext("2d");
                                serverDrawingUpdater = new ServerDrawingUpdater(currQuestion.id, canvasContextName);

                                eventsManager.registerMouseEvents();
                            }
                        };

                        eventsManager.registerHoverEvent(elementToHoverOn, onHoverCb);

                    }

                    function _setCanvasDimensions(canvasDomContainerElement, elementToCoverDomElement, canvasContextName, questionId) {
                        toolBoxCtrl.isExerciseReady().then(function () {
                            var exerciseDrawingRefProm;

                            // get the height and the width of the wrapper element
                            function _getDimensionsByElementSize() {
                                var height,width;
                                if (elementToCoverDomElement.scrollHeight) {
                                    height = elementToCoverDomElement.scrollHeight;
                                }
                                else {
                                    height = elementToCoverDomElement.offsetHeight;
                                }
                                if (elementToCoverDomElement.scrollWidth) {
                                    width = elementToCoverDomElement.scrollWidth;
                                }
                                else {
                                    width = elementToCoverDomElement.offsetWidth;
                                }
                                return {height: height, width: width};
                            }

                            // return the larger dimensions out of the element's dimensions and the saved FB dimensions
                            function _compareFbDimensionsWithElementDimensions(fbDimensions) {
                                var elementDimensions = _getDimensionsByElementSize();
                                var finalDimensions = {
                                    height : Math.max(elementDimensions.height, fbDimensions.height),
                                    width : Math.max(elementDimensions.width, fbDimensions.width)
                                };
                                exerciseDrawingRefProm.child('maxDimensions').update(finalDimensions);
                                return finalDimensions;
                            }

                            // set the canvas dimensions to the larger dimensions between the two ^
                            var setDimensionsCb = function(data) {
                                // DOM dimensions
                                var elementDimensions = _getDimensionsByElementSize();
                                // FB dimensions
                                var maxDimensions;
                                // nothing is saved on FB, set the dimensions to be element dimensions
                                if (!data.val()) {
                                    maxDimensions = elementDimensions;
                                }
                                else {
                                    maxDimensions = data.val();
                                }
                                // compare them and set the canvas dimensions to be the larger between the two
                                // also save the new maxDimensions to FB
                                var finalDimensions = _compareFbDimensionsWithElementDimensions(maxDimensions);            
                                canvasDomContainerElement[0].setAttribute('height', finalDimensions.height);
                                canvasDomContainerElement[0].setAttribute('width', finalDimensions.width);
                                canvasDomContainerElement.css('position', 'absolute');

                            };

                            // this piece of code fetches the previously calculated maxDimensions from firebase, and then kickstart all the functions we just went by above ^
                            _getFbRef(questionId, canvasContextName).then(function(ref) {
                                exerciseDrawingRefProm = ref;
                                eventsManager.registerDimensionsListener(exerciseDrawingRefProm.child('maxDimensions'), setDimensionsCb);
                            });



                        });

                    }

                    function addCanvasToElement(elementToCover, question) {
                        // we clone the element defined in _init to not mess with the upcoming append function (which doesn't work multiple times using the same element)
                        var canvasContainerElement = canvasContainerElementInitial.clone();
                        // cast selector element to html element
                        var elementToCoverDomElement = elementToCover[0];

                        // get the <canvas> element from the container
                        var canvasDomContainerElement = canvasContainerElement.children();
                        canvasDomElement = canvasDomContainerElement[0];

                        canvasContext = canvasDomElement.getContext("2d"); 

                        // this is the attribute name passed to znkExerciseDrawContainer directive
                        var canvasContextName = elementToCover.attr('canvas-name');

                        // when hovering over a canvas, set the global context to it
                        _setContextOnHover(elementToCover, canvasDomElement, canvasContextName);

                        _setCanvasDimensions(canvasDomContainerElement, elementToCoverDomElement, canvasContextName, question.id);
                        

                        elementToCover.append(canvasContainerElement);
                        $compile(canvasContainerElement)(scope);

                        // save to service for further management
                        if (!ZnkExerciseDrawSrv.canvasContextManager[question.id]) {
                            ZnkExerciseDrawSrv.canvasContextManager[question.id] = {};
                        }

                        ZnkExerciseDrawSrv.canvasContextManager[question.id][canvasContextName] = canvasContext;
                    }


                    

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex, oldIndex, _currQuestion) {
                        if (angular.isUndefined(scope.d.drawMode)) {
                            scope.d.drawMode = DRAWING_MODES.VIEW;
                        }

                        currQuestion = _currQuestion;

                        if (serverDrawingUpdater) {
                            serverDrawingUpdater.flush();
                        }

                        _reloadCanvas(); // re-registers fb listeners to reflect new question
                    });

                    _init();

                    // publish addCanvasToElement function to make it callable from znkExerciseDrawContainer directive
                    ZnkExerciseDrawSrv.addCanvasToElement = addCanvasToElement;
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseToolBoxModalCtrl', [
        '$scope', 'ZnkExerciseDrvSrv', 'Settings',
        function ($scope, ZnkExerciseDrvSrv, Settings) {
            Settings.actions = Settings.actions || {};
            Settings.events = Settings.events || {};
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;

            $scope.d = {
                blackboardTool: {
                    actions: {},
                    value: {}
                },
                bookmarkTool: {},
                showPagerTool: {},
                tools: ZnkExerciseDrvSrv.toolBoxTools,
                toolsStatus: {},
                toolsToHide: Settings.toolsToHide
            };

            Settings.actions.setToolValue = function (tool, value) {
                switch (tool) {
                    case $scope.d.tools.BOOKMARK:
                        $scope.d.bookmarkTool.value = value;
                        break;
                    case $scope.d.tools.BLACKBOARD:
                        $scope.d.blackboardTool.value = value;
                        break;
                }
            };

            $scope.d.openTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                Settings.events.onToolOpened(eventObj);
                $scope.d.toolsStatus[tool] = true;
            };

            $scope.d.closeTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                switch (tool) {
                    case $scope.d.tools.BLACKBOARD:
                        eventObj.value = $scope.d.blackboardTool.value;
                        break;
                    case $scope.d.tools.BOOKMARK:
                        eventObj.value = $scope.d.bookmarkTool.value;
                }
                Settings.events.onToolClosed(eventObj);
                $scope.d.toolsStatus[tool] = false;
            };

            function triggerToolValueChangedEvent(tool, newStatus) {
                var eventObj = {
                    tool: tool,
                    value: newStatus
                };
                if(Settings.events.onToolValueChanged){
                    Settings.events.onToolValueChanged(eventObj);
                }
            }

            $scope.d.reverseBookmarkValue = function () {
                $scope.d.bookmarkTool.value = !$scope.d.bookmarkTool.value;
                triggerToolValueChangedEvent($scope.d.tools.BOOKMARK, $scope.d.bookmarkTool.value);
            };

            $scope.d.activateBlackboardPencil = function(){
                if(!$scope.d[$scope.d.tools.BLACKBOARD]){
                    $scope.d.openTool($scope.d.tools.BLACKBOARD);
                }

                $scope.d.blackboardTool.pencilActivated = true;
                if ($scope.d.blackboardTool.actions.activatePen) {
                    $scope.d.blackboardTool.actions.activatePen();
                }
            };

            $scope.d.activateBlackboardEraser = function(){
                $scope.d.blackboardTool.pencilActivated = false;
                if ($scope.d.blackboardTool.actions.activateEraser) {
                    $scope.d.blackboardTool.actions.activateEraser();
                }
            };

            $scope.d.reverseShowPagerValue = function(){
                $scope.d.showPagerTool.value = !$scope.d.showPagerTool.value;
                triggerToolValueChangedEvent($scope.d.tools.SHOW_PAGER, $scope.d.showPagerTool.value);
            };

            $scope.d.onCalcClick = function(){
                if($scope.d.toolsStatus.hasOwnProperty($scope.d.tools.CALCULATOR)){
                    $scope.d.closeTool($scope.d.tools.CALCULATOR);
                }else{
                    $scope.d.openTool($scope.d.tools.CALCULATOR);
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseEventsConst = {};

    exerciseEventsConst.tutorial = {
        FINISH: 'tutorial:finish'
    };

    exerciseEventsConst.drill = {
        FINISH: 'drill:finish'
    };

    exerciseEventsConst.practice = {
        FINISH: 'practice:finish'
    };

    exerciseEventsConst.game = {
        FINISH: 'game:finish'
    };

    exerciseEventsConst.section = {
        FINISH: 'section:finish'
    };

    exerciseEventsConst.daily = {
        STATUS_CHANGED: 'daily:status'
    };

    exerciseEventsConst.exam = {
        COMPLETE: 'exam:complete'
    };

    angular.module('znk.infra.znkExercise').constant('exerciseEventsConst', exerciseEventsConst);
})(angular);

/**
 * attrs:
 *  mobile-temp=
 *  desktop-temp=
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('templateByPlatform', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log',
        function (ZnkExerciseSrv, PlatformEnum, $log) {
            return {
                templateUrl: function(element, attrs){
                    var templateUrl;
                    var prefix = attrs.prefix || '';
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform){
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl = attrs.desktopTemp;
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl = attrs.mobileTemp;
                            break;
                    }
                    if(!templateUrl){
                        $log.error('templateByPlatform directive: template was not defined for platform');
                    }
                    return prefix + '/' + templateUrl;
                },
                restrict: 'E'
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    var exerciseAnswerStatusConst = {
        unanswered: 0,
        correct: 1,
        wrong: 2
    };
    angular.module('znk.infra.znkExercise').constant('exerciseAnswerStatusConst', exerciseAnswerStatusConst);

    angular.module('znk.infra.znkExercise').factory('ExerciseAnswerStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            var ExerciseAnswerStatusEnum = new EnumSrv.BaseEnum([
                ['unanswered', exerciseAnswerStatusConst.unanswered, 'unanswered'],
                ['correct', exerciseAnswerStatusConst.correct, 'correct'],
                ['wrong', exerciseAnswerStatusConst.wrong, 'wrong']
            ]);

            ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum = function(answer) {
                switch (answer) {
                    case true:
                        return ExerciseAnswerStatusEnum.correct.enum;
                    case false:
                        return ExerciseAnswerStatusEnum.wrong.enum;
                    default :
                        return ExerciseAnswerStatusEnum.unanswered.enum;
                }
            };

            return ExerciseAnswerStatusEnum;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('PlatformEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['MOBILE', 1, 'mobile'],
                ['DESKTOP', 2, 'desktop']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSlideDirectionEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['ALL', 2, 'all'],
                ['RIGHT', 3, 'right'],
                ['LEFT', 4, 'left']
            ])
            ;
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseViewModeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['ANSWER_WITH_RESULT', 1, 'answer with result'],
                ['ONLY_ANSWER', 2, 'answer only'],
                ['REVIEW', 3, 'review'],
                ['MUST_ANSWER', 4, 'must answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseUtilitySrv', function () {

            // default true for all
            var broadCastExerciseFn = function() {
                return function() {
                    return true;
                };
            };

            this.setShouldBroadCastExerciseGetter = function(_broadCastExerciseFn) {
                broadCastExerciseFn = _broadCastExerciseFn;
            };

            this.$get = ["AnswerTypeEnum", "$log", "$q", "$injector", function(AnswerTypeEnum, $log, $q, $injector) {
                'ngInject';

                var ZnkExerciseUtilitySrv = {};
                //@todo(igor) move to utility service
                ZnkExerciseUtilitySrv.bindFunctions = function(dest,src,functionToCopy){
                    functionToCopy.forEach(function(fnName){
                        dest[fnName] = src[fnName].bind(src);
                    });
                };

                var answersIdsMap;
                ZnkExerciseUtilitySrv.isAnswerCorrect = function isAnswerCorrect(question, userAnswer) {
                    var isCorrect, answer;
                    switch (question.answerTypeId) {
                        case AnswerTypeEnum.SELECT_ANSWER.enum:
                            answer = '' + userAnswer;
                            isCorrect = ('' + question.correctAnswerId) === answer;
                            break;
                        case AnswerTypeEnum.FREE_TEXT_ANSWER.enum:
                            answer = '' + userAnswer;
                            answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                                return '' + answerMap.content;
                            });
                            isCorrect = answersIdsMap.indexOf(answer) !== -1;
                            break;
                        case AnswerTypeEnum.RATE_ANSWER.enum:
                            answer = '' + userAnswer;
                            answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                                return '' + answerMap.id;
                            });
                            isCorrect = answersIdsMap.indexOf(answer) !== -1;
                            break;
                    }

                    return !!isCorrect;
                };

                ZnkExerciseUtilitySrv.setQuestionsGroupData = function (questions, groupData) {
                    var groupDataMap = {};

                    angular.forEach(groupData, function (group) {
                        groupDataMap[group.id] = group;
                    });

                    angular.forEach(questions, function (question) {
                        if (question.groupDataId && !groupDataMap[question.groupDataId]) {
                            $log.debug('Group data is missing for the following question id ' + question.id);
                        }

                        question.groupData = groupDataMap[question.groupDataId] || {};
                    });
                };

                ZnkExerciseUtilitySrv.shouldBroadCastExercisePromFnGetter = function() {
                    try {
                        return $q.when($injector.invoke(broadCastExerciseFn));
                    } catch (e) {
                        $log.error('ZnkExerciseUtilitySrv shouldBroadCastExercise: failed in invoke broadCastExerciseFn');
                        return $q.reject(e);
                    }
                };

                return ZnkExerciseUtilitySrv;
            }];
        }
    );
})(angular);

angular.module('znk.infra.znkExercise').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkExercise/core/template/btnSectionDesktopTemplate.html",
    "<div class=\"btn-container left-container ng-hide\"\n" +
    "     ng-show=\"!!vm.currentQuestionIndex && vm.slideRightAllowed\">\n" +
    "    <button ng-click=\"vm.prevQuestion()\">\n" +
    "        <svg-icon name=\"znk-exercise-chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"btn-container right-container ng-hide\"\n" +
    "     ng-show=\"vm.maxQuestionIndex !== vm.currentQuestionIndex && vm.slideLeftAllowed\"\n" +
    "     ng-class=\"{'question-answered': vm.isCurrentQuestionAnswered}\">\n" +
    "    <button ng-click=\"vm.nextQuestion()\">\n" +
    "        <svg-icon name=\"znk-exercise-chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"done-btn-wrap show-opacity-animate\" ng-if=\"vm.showDoneButton\">\n" +
    "    <button tabindex=\"0\"\n" +
    "            class=\"done-btn\"\n" +
    "            ng-click=\"onDone()\">DONE\n" +
    "    </button>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/btnSectionMobileTemplate.html",
    "<div ng-class=\"{ 'next-disabled' : settings.slideDirection === d.slideDirections.NONE ||  settings.slideDirection === d.slideDirections.RIGHT }\">\n" +
    "    <div class=\"bookmark-icon-container only-tablet\"\n" +
    "         ng-class=\"vm.questionsWithAnswers[vm.currentSlide].__questionStatus.bookmark ? 'bookmark-active-icon' : 'bookmark-icon'\"\n" +
    "         ng-click=\"vm.bookmarkCurrentQuestion()\"\n" +
    "         ng-hide=\"settings.viewMode === d.reviewModeId\"></div>\n" +
    "    <ng-switch\n" +
    "            on=\"vm.currentSlide !== vm.questionsWithAnswers.length - 1 && vm.answeredCount !== vm.questionsWithAnswers.length\"\n" +
    "            ng-hide=\"settings.viewMode === d.reviewModeId\"\n" +
    "            class=\"ng-hide\"\n" +
    "            ng-click=\"d.next()\">\n" +
    "        <button ng-switch-when=\"true\"\n" +
    "                class=\"btn next\">\n" +
    "            <div class=\"only-tablet\">\n" +
    "                <span>NEXT</span>\n" +
    "                <i class=\"question-arrow-right-icon\"></i>\n" +
    "            </div>\n" +
    "        </button>\n" +
    "        <button ng-switch-when=\"false\"\n" +
    "                class=\"btn finish\">\n" +
    "            <div>DONE</div>\n" +
    "        </button>\n" +
    "    </ng-switch>\n" +
    "    <button class=\"btn sum ng-hide\"\n" +
    "            ng-click=\"settings.onSummary()\"\n" +
    "            ng-show=\"settings.viewMode === d.reviewModeId\">\n" +
    "        SUMMARY\n" +
    "    </button>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/questionSwiperDesktopTemplate.html",
    "<znk-swiper ng-if=\"vm.questions.length\"\n" +
    "            class=\"znk-carousel\"\n" +
    "            ng-model=\"vm.currSlideIndex\"\n" +
    "            actions=\"vm.swiperActions\"\n" +
    "            ng-change=\"vm.SlideChanged()\"\n" +
    "            disable-swipe=\"{{vm.isLocked}}\">\n" +
    "    <div class=\"swiper-slide\"\n" +
    "        ng-repeat=\"question in vm.questions\">\n" +
    "        <znk-question-report report-data=\"question\"></znk-question-report>\n" +
    "        <question-builder question=\"question\"\n" +
    "                          rate-answer-formatter-parser\n" +
    "                          ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                          ng-change=\"onQuestionAnswered(question)\">\n" +
    "        </question-builder>\n" +
    "    </div>\n" +
    "</znk-swiper>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/questionSwiperMobileTemplate.html",
    "<ion-slide-box znk-slide=\"settings.slideDirection\" class=\"znk-carousel\"\n" +
    "               show-pager=\"false\"\n" +
    "               active-slide=\"vm.currentSlide\">\n" +
    "    <question-builder slide-repeat-drv=\"question in vm.questionsWithAnswers\"\n" +
    "                      question=\"question\"\n" +
    "                      ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                      ng-change=\"vm.questionAnswered(question)\">\n" +
    "    </question-builder>\n" +
    "</ion-slide-box>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkExerciseDrv.html",
    "<div ng-transclude></div>\n" +
    "<questions-carousel class=\"znk-carousel-container\"\n" +
    "                    questions=\"vm.questionsWithAnswers\"\n" +
    "                    disable-swipe=\"{{vm.slideDirection !== 2}}\"\n" +
    "                    ng-model=\"vm.currentSlide\"\n" +
    "                    on-question-answered=\"vm.questionAnswered()\"\n" +
    "                    slide-direction=\"{{vm.slideDirection}}\">\n" +
    "</questions-carousel>\n" +
    "<div class=\"question-bottom-shadow\"></div>\n" +
    "<znk-exercise-btn-section class=\"btn-section\"\n" +
    "                          prev-question=\"vm.setCurrentIndexByOffset(-1)\"\n" +
    "                          next-question=\"vm.setCurrentIndexByOffset(1)\"\n" +
    "                          on-done=\"settings.onDone()\"\n" +
    "                          actions=\"vm.btnSectionActions\">\n" +
    "</znk-exercise-btn-section>\n" +
    "<znk-exercise-pager class=\"ng-hide show-opacity-animate\"\n" +
    "                    ng-show=\"vm.showPager\"\n" +
    "                    questions=\"vm.questionsWithAnswers\"\n" +
    "                    ng-model=\"vm.currentSlide\">\n" +
    "</znk-exercise-pager>\n" +
    "<znk-exercise-tool-box settings=\"settings.toolBox\">\n" +
    "</znk-exercise-tool-box>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkExercisePagerDrv.html",
    "<znk-scroll>\n" +
    "    <div class=\"pager-items-wrapper\">\n" +
    "        <div class=\"pager-item noselect\"\n" +
    "             ng-repeat=\"question in questions\"\n" +
    "             question-status=\"question.__questionStatus\"\n" +
    "             question=\"question\"\n" +
    "             ng-click=\"d.tap($index)\">\n" +
    "            <div class=\"question-bookmark-icon\"></div>\n" +
    "            <div class=\"question-status-indicator\">\n" +
    "                <div class=\"index\">{{::$index + 1}}</div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</znk-scroll>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkSwiperTemplate.html",
    "<div class=\"swiper-container\">\n" +
    "    <!-- Additional required wrapper -->\n" +
    "    <div class=\"swiper-wrapper\" ng-transclude>\n" +
    "        <!-- Slides -->\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/arrow-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" viewBox=\"-468.2 482.4 96 89.8\" class=\"arrow-icon-wrapper\">\n" +
    "    <style type=\"text/css\">\n" +
    "        .arrow-icon-wrapper{width: 48px;  height:auto;}\n" +
    "        .arrow-icon-wrapper .st0{fill:#109BAC;}\n" +
    "        .arrow-icon-wrapper .st1{fill:none;stroke:#fff;stroke-width:5.1237;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "    </style>\n" +
    "    <path class=\"st0\" d=\"M-417.2,572.2h-6.2c-24.7,0-44.9-20.2-44.9-44.9v0c0-24.7,20.2-44.9,44.9-44.9h6.2c24.7,0,44.9,20.2,44.9,44.9\n" +
    "    v0C-372.2,552-392.5,572.2-417.2,572.2z\"/>\n" +
    "    <g>\n" +
    "        <line class=\"st1\" x1=\"-442.8\" y1=\"527.3\" x2=\"-401.4\" y2=\"527.3\"/>\n" +
    "        <line class=\"st1\" x1=\"-401.4\" y1=\"527.3\" x2=\"-414.3\" y2=\"514.4\"/>\n" +
    "        <line class=\"st1\" x1=\"-401.4\" y1=\"527.3\" x2=\"-414.3\" y2=\"540.2\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/chevron-icon.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     viewBox=\"0 0 143.5 65.5\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     class=\"znk-exercise-chevron-svg\">\n" +
    "    <style>\n" +
    "        .znk-exercise-chevron-svg{\n" +
    "            height: 16px;\n" +
    "        }\n" +
    "\n" +
    "        .znk-exercise-chevron-svg .st0{\n" +
    "            stroke: #0a9bad;\n" +
    "            fill: none;\n" +
    "            stroke-width: 12;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-linejoin: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "    </style>\n" +
    "    <polyline class=\"st0\" points=\"6,6 71.7,59.5 137.5,6 \"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/correct-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"correct-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\"\n" +
    "     style=\"enable-background:new 0 0 188.5 129;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.correct-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/report-question-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 141.3 179.7\" class=\"report-question-icon\">\n" +
    "	    <style type=\"text/css\">\n" +
    "        .report-question-icon {\n" +
    "            fill: #ffffff;\n" +
    "            width: 100%;\n" +
    "            height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g id=\"_x33_UU5wB.tif\">\n" +
    "	<g>\n" +
    "		<path d=\"M141.3,68.7c0,0.7,0,1.3,0,2c-6.7,12.2-18,17.3-31,18.9c-10.5,1.3-21.2,1.6-31.7,3.2c-9.7,1.5-18.4,5.5-24.3,14.1\n" +
    "			c-1.8,2.6-2,4.8-0.5,7.7c8,16.3,15.7,32.6,23.6,49c4.2,8.8,3.8,10.4-3.9,16.1c-2.3,0-4.7,0-7,0c-1.8-2.7-3.8-5.3-5.2-8.3\n" +
    "			c-9.8-20-19.4-40.1-29.1-60.1C21.8,90.4,11.7,69.4,1.6,48.5c-1.8-3.7-2.6-8,0.6-10.6c2.5-2.1,6.6-3,9.9-2.9\n" +
    "			c2.2,0.1,4.3,2.9,6.5,4.6c8.9-11.4,14.8-15.2,28.2-17.5c5.9-1,11.9-0.9,17.9-1.4c16.6-1.3,33.1-2.9,42.7-20.7\n" +
    "			c3.3,6.8,6.4,13,9.4,19.2C124.9,35.7,133.1,52.2,141.3,68.7z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-eraser.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 180.8 171.2\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"znk-exercise-eraser\">\n" +
    "<style type=\"text/css\">\n" +
    "    .znk-exercise-eraser {\n" +
    "        width: 26px;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-eraser .st0 {\n" +
    "        fill: none;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-eraser .st1 {\n" +
    "        fill: url(#znk-exercise-eraser-SVGID_1_);\n" +
    "    }\n" +
    "</style>\n" +
    "<pattern  x=\"-3207.2\" y=\"-3890.7\" width=\"4.5\" height=\"4.3\" patternUnits=\"userSpaceOnUse\" id=\"New_Pattern_Swatch_3\" viewBox=\"0 -4.3 4.5 4.3\" style=\"overflow:visible;\">\n" +
    "	<g>\n" +
    "		<polygon class=\"st0\" points=\"0,0 4.5,0 4.5,-4.3 0,-4.3 		\"/>\n" +
    "		<polygon points=\"0.7,-3.6 0,-3.6 0,-4.3 0.7,-4.3 		\"/>\n" +
    "		<polygon points=\"4.5,-3.6 3.8,-3.6 3.8,-4.3 4.5,-4.3 		\"/>\n" +
    "		<polygon points=\"0.7,0 0,0 0,-0.7 0.7,-0.7 		\"/>\n" +
    "		<polygon points=\"4.5,0 3.8,0 3.8,-0.7 4.5,-0.7 		\"/>\n" +
    "	</g>\n" +
    "</pattern>\n" +
    "<path d=\"M89.5,171.2H57.9c-0.5,0-1.1-0.2-1.5-0.5l-44.3-33.1c-1.1-0.8-1.3-2.4-0.5-3.5l58.6-78.5c0.8-1.1,2.4-1.3,3.5-0.5\n" +
    "	c1.1,0.8,1.3,2.4,0.5,3.5l-57.1,76.4l41.6,31.1h29.6l47.2-61.8c0.8-1.1,2.4-1.3,3.5-0.5c1.1,0.8,1.3,2.4,0.5,3.5l-47.9,62.8\n" +
    "	C91.1,170.9,90.3,171.2,89.5,171.2z\"/>\n" +
    "<g>\n" +
    "\n" +
    "		<pattern  id=\"znk-exercise-eraser-SVGID_1_\"\n" +
    "                  xlink:href=\"#New_Pattern_Swatch_3\"\n" +
    "                  patternTransform=\"matrix(1.4011 -0.2109 0.2109 1.4011 2667.2153 506.0711)\">\n" +
    "	</pattern>\n" +
    "	<polyline class=\"st1\" points=\"134.6,109.5 127.3,118.6 127.3,118.6 61.8,70.2 72.4,56.9 113,2.5 178.3,51.2 137.7,105.6 	\"/>\n" +
    "	<path d=\"M127.3,121.1c-0.5,0-1-0.2-1.5-0.5L60.3,72.2c-0.5-0.4-0.9-1-1-1.7c-0.1-0.7,0.1-1.4,0.5-1.9l10.6-13.3L111,1\n" +
    "		c0.4-0.5,1-0.9,1.6-1c0.7-0.1,1.3,0.1,1.9,0.5l65.3,48.7c1.1,0.8,1.3,2.4,0.5,3.5l-40.6,54.4c-0.8,1-2.1,1.3-3.2,0.7\n" +
    "		c0.8,0.9,0.9,2.3,0.1,3.2l-7.3,9.1C128.8,120.8,128.1,121.1,127.3,121.1z M65.4,69.7l61.5,45.4l5.8-7.2c0.8-1,2.1-1.2,3.1-0.6\n" +
    "		c-0.8-0.9-0.9-2.2-0.1-3.2l39.1-52.4L113.5,6L74.4,58.4L65.4,69.7z\"/>\n" +
    "</g>\n" +
    "<rect y=\"166.2\" width=\"89.5\" height=\"5\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-pencil.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 138.2 171.4\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"znk-exercise-pencil\">\n" +
    "<style>\n" +
    "    .znk-exercise-pencil{\n" +
    "        width: 20px;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<g>\n" +
    "		<path d=\"M0,171.4C0,171.4,0,171.4,0,171.4c3.7-19,7.5-38,11.2-57L94.6,6.6c9.3-6.9,19.5-8.3,30.7-4.6c2.4,1.9,4.7,3.7,7.1,5.6\n" +
    "			c6.3,9.9,7.6,20.1,3.2,30.8L52.3,146.2C34.9,154.6,17.4,163,0,171.4z M50.3,140c26.9-34.9,53.6-69.1,80-103.7\n" +
    "			c5.5-7.3,3.8-18.5-2.6-24.8c-9.6-9.5-23.3-8.7-31.6,1.9c-25.2,32.5-50.3,65-75.4,97.6c-1,1.2-1.7,2.6-2.6,4l7.6,5.9\n" +
    "			c1.4-1.9,2.6-3.4,3.8-5c22.8-29.5,45.6-59.1,68.5-88.6c0.8-1,1.4-2.2,2.4-2.9c1.2-0.8,2.7-1.1,4-1.6c0,1.6,0.3,3.2-0.1,4.7\n" +
    "			c-0.4,1.3-1.7,2.3-2.5,3.5C79,60.1,56.3,89.5,33.6,118.9c-1.3,1.6-2.5,3.3-3.8,4.9l9.5,7.4c1.6-2.1,2.9-3.8,4.2-5.5\n" +
    "			c23.2-30,46.3-59.9,69.5-89.8c1.1-1.4,3.3-1.8,5-2.7c-0.4,1.9-0.5,3.9-1.2,5.6c-0.5,1.3-1.7,2.3-2.6,3.5\n" +
    "			c-22.4,29-44.8,57.9-67.1,86.9c-1.3,1.7-2.6,3.3-4,5.2L50.3,140z M16.3,120.6c-0.4,0.5-3.8,19.1-5.8,30.2c-0.6,3.6,2.9,6.4,6.2,5\n" +
    "			c8.9-3.7,23.2-9.7,29-12.5L16.3,120.6z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-pointer.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     class=\"znk-exercise-pointer\"\n" +
    "	 viewBox=\"0 0 150.4 169.6\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style>\n" +
    "    .znk-exercise-pointer{\n" +
    "        width: 18px;\n" +
    "    }\n" +
    "</style>\n" +
    "<path d=\"M34.4,169.6c-1.6,0-3.2-0.5-4.6-1.6l-13-10.1c-3.2-2.5-3.9-7-1.6-10.3l33.2-48.5c0.4-0.6,0.5-1.4,0.3-2.2\n" +
    "	c-0.2-0.7-0.8-1.3-1.5-1.5L4.4,81.1C1.9,80.2,0.2,78,0,75.3c-0.2-2.6,1.2-5.1,3.6-6.3L143,0.5c1.8-0.9,3.9-0.7,5.4,0.5\n" +
    "	c1.6,1.2,2.3,3.2,1.9,5.1l-31.2,152.1c-0.5,2.6-2.6,4.6-5.2,5.1c-2.6,0.5-5.2-0.6-6.7-2.8l-24.7-37.6c-0.4-0.7-1.1-1.1-1.9-1.1\n" +
    "	c-0.8-0.1-1.5,0.3-2,0.8L40.1,167C38.6,168.7,36.5,169.6,34.4,169.6z M145.3,5C145.2,5,145.2,5,145.3,5L5.8,73.5C5,73.9,5,74.7,5,75\n" +
    "	c0,0.3,0.2,1,1,1.3l42.8,14.4c2.2,0.8,3.9,2.5,4.7,4.7c0.7,2.2,0.4,4.6-0.9,6.6l-33.2,48.5c-0.8,1.1-0.5,2.7,0.6,3.5l13,10.1\n" +
    "	c1.1,0.8,2.6,0.7,3.5-0.3l38.5-44.4c1.5-1.8,3.8-2.7,6.1-2.6c2.4,0.2,4.5,1.4,5.8,3.4l24.7,37.6c0.5,0.8,1.3,0.7,1.6,0.7\n" +
    "	c0.3-0.1,1-0.3,1.2-1.2L145.4,5.2C145.4,5.2,145.4,5.1,145.3,5C145.3,5,145.3,5,145.3,5z\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-remove.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 176.3 173.8\"\n" +
    "     xml:space=\"preserve\"\n" +
    "class=\"znk-exercise-remove\">\n" +
    "    <style>\n" +
    "       .znk-exercise-remove{\n" +
    "           width: 22px;\n" +
    "       }\n" +
    "    </style>\n" +
    "<g>\n" +
    "	<path d=\"M173.3,20.8H3c-1.7,0-3-1.3-3-3s1.3-3,3-3h170.3c1.7,0,3,1.3,3,3S174.9,20.8,173.3,20.8z\"/>\n" +
    "	<path d=\"M89.1,173.8H41.5c-10.5,0-13.7-9.8-13.9-14.9L19.6,21.4c-0.1-1.7,1.2-3.1,2.8-3.2c1.6-0.1,3.1,1.2,3.2,2.8l8.1,137.5\n" +
    "		c0.1,1,0.7,9.3,7.9,9.3h47.6c1.7,0,3,1.3,3,3S90.8,173.8,89.1,173.8z\"/>\n" +
    "	<path d=\"M136.7,173.8H89.1c-1.7,0-3-1.3-3-3s1.3-3,3-3h47.6c7.2,0,7.9-8.3,7.9-9.2l8.1-137.5c0.1-1.7,1.5-2.9,3.2-2.8\n" +
    "		c1.7,0.1,2.9,1.5,2.8,3.2l-8.1,137.5C150.4,164.1,147.2,173.8,136.7,173.8z\"/>\n" +
    "	<path d=\"M120.5,20.8c-1.7,0-3-1.3-3-3v-6.4c0-3-2.4-5.4-5.4-5.4H65.5c-3,0-5.4,2.4-5.4,5.4v6.4c0,1.7-1.3,3-3,3s-3-1.3-3-3v-6.4\n" +
    "		C54.1,5.1,59.2,0,65.5,0h46.6c6.3,0,11.4,5.1,11.4,11.4v6.4C123.5,19.5,122.2,20.8,120.5,20.8z\"/>\n" +
    "	<path d=\"M62.5,147.7c-1.7,0-3-1.3-3-3v-103c0-1.7,1.3-3,3-3s3,1.3,3,3v103C65.5,146.3,64.2,147.7,62.5,147.7z\"/>\n" +
    "	<path d=\"M89.1,147.7c-1.7,0-3-1.3-3-3v-103c0-1.7,1.3-3,3-3s3,1.3,3,3v103C92.1,146.3,90.8,147.7,89.1,147.7z\"/>\n" +
    "	<path d=\"M114.6,147.7c-1.7,0-3-1.3-3-3v-103c0-1.7,1.3-3,3-3s3,1.3,3,3v103C117.6,146.3,116.3,147.7,114.6,147.7z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-touche.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 47.6 53.2\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"znk-exercise-touche-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "    .znk-exercise-touche-svg {\n" +
    "        width: 23px;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-touche-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #000000;\n" +
    "        stroke-width: 2;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-touche-svg .st1 {\n" +
    "        fill: none;\n" +
    "        stroke: #000000;\n" +
    "        stroke-width: 2;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M39.9,22.8v25.1c0,2.4-1.9,4.3-4.3,4.3H5.3c-2.4,0-4.3-1.9-4.3-4.3V12.6c0-2.4,1.9-4.3,4.3-4.3h15.7\"/>\n" +
    "<g>\n" +
    "	<path class=\"st1\" d=\"M22.4,33.8l23.7-23.7c0.7-0.7,0.7-1.8,0-2.4l-6.2-6.2c-0.7-0.7-1.8-0.7-2.4,0L13.8,25.2L22.4,33.8z\"/>\n" +
    "	<line class=\"st1\" x1=\"34.2\" y1=\"4.8\" x2=\"42.8\" y2=\"13.4\"/>\n" +
    "	<line class=\"st0\" x1=\"32.8\" y1=\"11.4\" x2=\"19.1\" y2=\"25.2\"/>\n" +
    "	<polyline class=\"st1\" points=\"13.8,25.2 11.6,36 22.4,33.8 	\"/>\n" +
    "</g>\n" +
    "<path class=\"st0\" d=\"M11,39.2c-1.8,1-6.4,4.1-3.2,5s13-2.1,13.1,0s-1,2.9-1,2.9\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/wrong-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"wrong-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 126.5 126.5\"\n" +
    "     style=\"enable-background:new 0 0 126.5 126.5;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.wrong-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"119\" y1=\"7.5\" x2=\"7.5\" y2=\"119\"/>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"7.5\" x2=\"119\" y2=\"119\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/toolbox/core/znkExerciseToolBoxDirective.template.html",
    "<znk-exercise-draw-tool settings=\"$ctrl.settings.drawing\">\n" +
    "</znk-exercise-draw-tool>\n" +
    "\n" +
    "");
  $templateCache.put("components/znkExercise/toolbox/tools/draw/znkExerciseDrawToolDirective.template.html",
    "<svg-icon name=\"znk-exercise-touche\"\n" +
    "          ng-click=\"d.toolClicked(d.TOOLS.TOUCHE)\"\n" +
    "          ng-class=\"{\n" +
    "            active:d.drawMode !== d.DRAWING_MODES.NONE\n" +
    "          }\">\n" +
    "</svg-icon>\n" +
    "<!--<svg-icon name=\"znk-exercise-pointer\">-->\n" +
    "<!--</svg-icon>-->\n" +
    "<svg-icon name=\"znk-exercise-pencil\"\n" +
    "          ng-click=\"d.toolClicked(d.TOOLS.PENCIL)\"\n" +
    "          ng-class=\"{\n" +
    "            active:d.drawMode === d.DRAWING_MODES.VIEW_DRAW\n" +
    "          }\">\n" +
    "</svg-icon>\n" +
    "<svg-icon name=\"znk-exercise-eraser\"\n" +
    "          ng-click=\"d.toolClicked(d.TOOLS.ERASER)\"\n" +
    "          ng-class=\"{\n" +
    "            active:d.drawMode === d.DRAWING_MODES.VIEW_ERASE\n" +
    "          }\">\n" +
    "</svg-icon>\n" +
    "<svg-icon name=\"znk-exercise-remove\"\n" +
    "          ng-click=\"d.cleanCanvas()\">\n" +
    "</svg-icon>\n" +
    "");
}]);
