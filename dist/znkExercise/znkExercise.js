(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', [
            'znk.infra.svgIcon',
            'znk.infra.scroll',
            'znk.infra.autofocus',
            'znk.infra.exerciseUtility',
            'ngAnimate'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    chevron: 'components/znkExercise/svg/chevron-icon.svg',
                    correct: 'components/znkExercise/svg/correct-icon.svg',
                    wrong: 'components/znkExercise/svg/wrong-icon.svg',
                    arrow: 'components/znkExercise/svg/arrow-icon.svg'
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

    angular.module('znk.infra.znkExercise').directive('answerBuilder', [
        '$compile', 'AnswerTypeEnum', 'ZnkExerciseUtilitySrv', 'ZnkExerciseViewModeEnum',
        function ($compile, AnswerTypeEnum, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum) {
            var typeToViewMap = {};

            typeToViewMap[AnswerTypeEnum.SELECT_ANSWER.enum] = '<select-answer></select-answer>';
            typeToViewMap[AnswerTypeEnum.FREE_TEXT_ANSWER.enum] = '<free-text-answer></free-text-answer>';
            typeToViewMap[AnswerTypeEnum.RATE_ANSWER.enum] = '<rate-answer></rate-answer>';

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

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswer', ['ZnkExerciseViewModeEnum', '$timeout', 'ZnkExerciseEvents', 'ZnkExerciseAnswersSrv',

        function (ZnkExerciseViewModeEnum, $timeout, ZnkExerciseEvents, ZnkExerciseAnswersSrv) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/freeTextAnswerDrv.html',
                require: ['^ngModel', '^answerBuilder'],
                scope:{},
                link: function (scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var questionIndex = answerBuilder.question.__questionStatus.index;
                    var currentSlide = answerBuilder.getCurrentIndex();    // current question/slide in the viewport
                    var body = document.body;


                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;
                    var keyMap = {};

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;

                    scope.d.click = function (answer) {
                        var viewMode = answerBuilder.getViewMode();

                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    function keyboardHandler(key){
                        key = String.fromCharCode(key.keyCode).toUpperCase();
                        if(angular.isDefined(keyMap[key])){
                            scope.d.click(scope.d.answers[keyMap[key]]);
                        }
                    }

                    if(questionIndex === currentSlide){
                        body.addEventListener('keydown',keyboardHandler);
                    }

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED,function(event,value ,prevValue ,currQuestion){
                        var currentSlide = currQuestion.__questionStatus.index;
                        if(questionIndex !== currentSlide){
                            body.removeEventListener('keydown',keyboardHandler);
                        }else{
                            body.addEventListener('keydown',keyboardHandler);
                        }
                    });



                    scope.d.getIndexChar = function(answerIndex){
                        var key = ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex(answerIndex,answerBuilder.question);
                        keyMap[key] = answerIndex;
                        return key;
                    };

                    function updateAnswersFollowingSelection(viewMode) {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = answerBuilder.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {

                            var $answerElem = angular.element($answers[i]);
                            if(!$answerElem || !$answerElem.scope || !$answerElem.scope()){
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (answerBuilder.getViewMode() === MODE_ANSWER_ONLY || answerBuilder.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (answerBuilder.getViewMode() === MODE_REVIEW) {
                                        classToAdd = correctAnswerId === answer.id ? 'answered-incorrect' : 'neutral';
                                    }
                                } else if (selectedAnswerId === answer.id) {
                                    // this is the selected answer
                                    classToAdd = correctAnswerId === answer.id ? 'correct' : 'wrong';
                                } else {
                                    // this is the correct answer but the user didn't select it
                                    classToAdd = answer.id === correctAnswerId ? 'answered-incorrect' : 'neutral';
                                }
                            }
                            $answerElem.removeClass(classToRemove);
                            $answerElem.addClass(classToAdd);
                            if (viewMode === MODE_ANSWER_WITH_QUESTION){
                                if (classToAdd === 'correct'){

                                }
                                if (classToAdd === 'wrong'){

                                }
                            }
                        }
                    }

                    ngModelCtrl.$render = function () {
                        //skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function(){
                            updateAnswersFollowingSelection();
                        });
                    };
                    //ng model controller render function not triggered in case render function was set
                    // after the model value was changed
                    ngModelCtrl.$render();

                    scope.$on('exercise:viewModeChanged', function () {
                        ngModelCtrl.$render();
                    });

                    scope.$on('$destroy',function(){
                        body.removeEventListener('keydown',keyboardHandler);
                    });
                }
            };
        }
    ]);
})(angular);



/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswer', ['ZnkExerciseViewModeEnum',
        function (ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/rateAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var domElement = element[0];

                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var viewMode = answerBuilder.getViewMode();
                    var ANSWER_WITH_RESULT_MODE = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        REVIEW_MODE = ZnkExerciseViewModeEnum.REVIEW.enum;
                    var INDEX_OFFSET = 2;

                    scope.d = {};
                    scope.d.itemsArray = new Array(11);
                    var answers = answerBuilder.question.correctAnswerText;

                    var domItemsArray;

                    var destroyWatcher = scope.$watch(
                        function () {
                            return element[0].querySelectorAll('.item-repeater');
                        },
                        function (val) {
                            if (val) {
                                destroyWatcher();
                                domItemsArray = val;

                                if (viewMode === REVIEW_MODE) {
                                    scope.clickHandler = angular.noop;
                                    updateItemsByCorrectAnswers(scope.d.answers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }

                                ngModelCtrl.$render = function(){
                                    updateItemsByCorrectAnswers();
                                };
                                ngModelCtrl.$render();
                            }
                        }
                    );

                    function clickHandler(index) {
                        if (answerBuilder.canUserAnswerBeChanged()) {
                            return;
                        }

                        ngModelCtrl.$setViewValue(index);
                        updateItemsByCorrectAnswers();
                    }

                    function updateItemsByCorrectAnswers() {
                        var oldSelectedElement = angular.element(domElement.querySelector('.selected'));
                        oldSelectedElement.removeClass('selected');

                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var newSelectedElement = angular.element(domItemsArray[selectedAnswerId]);
                        newSelectedElement.addClass('selected');

                        var lastElemIndex = answers.length - 1;

                        if((viewMode === ANSWER_WITH_RESULT_MODE && angular.isNumber(selectedAnswerId))|| viewMode === REVIEW_MODE){
                            for (var i = 0; i < lastElemIndex; i++) {
                                angular.element(domItemsArray[answers[i].id - INDEX_OFFSET]).addClass('correct');
                            }
                            angular.element(domItemsArray[answers[lastElemIndex].id - INDEX_OFFSET]).addClass('correct-edge');
                        }

                        if (angular.isNumber(selectedAnswerId) && (viewMode === REVIEW_MODE || viewMode === ANSWER_WITH_RESULT_MODE)) {
                            if (selectedAnswerId >= answers[0].id - INDEX_OFFSET && selectedAnswerId <= answers[lastElemIndex].id - INDEX_OFFSET) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }
                }
            };
        }
    ]);
})(angular);



/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('selectAnswer', [
        '$timeout', 'ZnkExerciseViewModeEnum', 'ZnkExerciseAnswersSrv', 'ZnkExerciseEvents',
        function ($timeout, ZnkExerciseViewModeEnum, ZnkExerciseAnswersSrv, ZnkExerciseEvents) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/selectAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                restrict:'E',
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var questionIndex = answerBuilder.question.__questionStatus.index;
                    var currentSlide = answerBuilder.getCurrentIndex();    // current question/slide in the viewport
                    var body = document.body;


                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;
                    var keyMap = {};

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;

                    scope.d.click = function (answer) {
                        var viewMode = answerBuilder.getViewMode();

                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    function keyboardHandler(key){
                        key = String.fromCharCode(key.keyCode).toUpperCase();
                        if(angular.isDefined(keyMap[key])){
                            scope.d.click(scope.d.answers[keyMap[key]]);
                        }
                    }

                    if(questionIndex === currentSlide){
                        body.addEventListener('keydown',keyboardHandler);
                    }

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED,function(event,value ,prevValue ,currQuestion){
                        var currentSlide = currQuestion.__questionStatus.index;
                        if(questionIndex !== currentSlide){
                            body.removeEventListener('keydown',keyboardHandler);
                        }else{
                            body.addEventListener('keydown',keyboardHandler);
                        }
                    });



                    scope.d.getIndexChar = function(answerIndex){
                        var key = ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex(answerIndex,answerBuilder.question);
                        keyMap[key] = answerIndex;
                        return key;
                    };

                    function updateAnswersFollowingSelection(viewMode) {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = answerBuilder.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {

                            var $answerElem = angular.element($answers[i]);
                            if(!$answerElem || !$answerElem.scope || !$answerElem.scope()){
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (answerBuilder.getViewMode() === MODE_ANSWER_ONLY || answerBuilder.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (answerBuilder.getViewMode() === MODE_REVIEW) {
                                        classToAdd = correctAnswerId === answer.id ? 'answered-incorrect' : 'neutral';
                                    }
                                } else if (selectedAnswerId === answer.id) {
                                    // this is the selected answer
                                    classToAdd = correctAnswerId === answer.id ? 'correct' : 'wrong';
                                } else {
                                    // this is the correct answer but the user didn't select it
                                    classToAdd = answer.id === correctAnswerId ? 'answered-incorrect' : 'neutral';
                                }
                            }
                            $answerElem.removeClass(classToRemove);
                            $answerElem.addClass(classToAdd);
                            if (viewMode === MODE_ANSWER_WITH_QUESTION){
                                if (classToAdd === 'correct'){

                                }
                                if (classToAdd === 'wrong'){

                                }
                            }
                        }
                    }

                    ngModelCtrl.$render = function () {
                        //skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function(){
                            updateAnswersFollowingSelection();
                        });
                    };
                    //ng model controller render function not triggered in case render function was set
                    // after the model value was changed
                    ngModelCtrl.$render();

                    scope.$on('exercise:viewModeChanged', function () {
                        ngModelCtrl.$render();
                    });

                    scope.$on('$destroy',function(){
                        body.removeEventListener('keydown',keyboardHandler);
                    });
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

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswerGrid', [
        function () {
            return {
                templateUrl: 'scripts/exercise/templates/freeTextAnswerGridDrv.html',
                restrict: 'E',
                require: 'ngModel',
                scope: {
                    cellsNumGetter: '&cellsNum'
                },
                link: function (scope, element, attrs, ngModelCtrl) {

                    scope.buttonArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];

                    var numberOfCells = scope.cellsNumGetter() || 3;

                    scope.d = {
                        viewCells: new Array(numberOfCells)
                    };

                    function updateNgModelViewValue() {
                        ngModelCtrl.$setViewValue(angular.copy(scope.d.cells));
                    }

                    scope.onClickNum = function (num) {
                        if (attrs.disabled || scope.d.cells.length >= numberOfCells) {
                            return;
                        }

                        scope.d.cells.push(num);
                        updateNgModelViewValue();
                    };

                    scope.onClickErase = function () {
                        if (attrs.disabled || !scope.d.cells.length) {
                            return;
                        }

                        scope.d.cells.pop();
                        updateNgModelViewValue();
                    };

                    ngModelCtrl.$render = function () {
                        scope.d.cells = angular.isDefined(ngModelCtrl.$viewValue) ? ngModelCtrl.$viewValue : [];
                    };
                }
            };
        }]);
}(angular));

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
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseSlideDirectionEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseSlideDirectionEnum) {
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

                    scope.$watch('questionsGetter().length',function(newNum){
                        var notBindedQuestions = scope.questionsGetter();
                        if(newNum && !scope.vm.questions){
                            scope.vm.questions = notBindedQuestions;
                            return;
                        }
                        scope.vm.questions = notBindedQuestions;
                        scope.vm.swiperActions.updateFollowingSlideAddition();
                    });
                }
            };
        }
    ]);
})(angular);



(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswerFormatterParser', ['AnswerTypeEnum',
        function (AnswerTypeEnum) {
            return {
                require: ['ngModel','questionBuilder'],
                link: function(scope, elem, attrs, ctrls){
                    var ngModelCtrl = ctrls[0];
                    var questionBuilderCtrl = ctrls[1];
                    var answerTypeId = questionBuilderCtrl.question.answerTypeId;

                    if(answerTypeId === AnswerTypeEnum.RATE_ANSWER.enum){
                        var INDEX_OFFSET = 2;
                        ngModelCtrl.$formatters.push(function(answer){
                            return angular.isDefined(answer) ? answer - INDEX_OFFSET : undefined;
                        });
                        ngModelCtrl.$parsers.push(function(index){
                            return angular.isDefined(index) ? index + INDEX_OFFSET : undefined;
                        });

                    }
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
                            return index && index === (questions.length - 1);
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
                        body.addEventListener('keydown',keyboardClickCB);

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
                            body.removeEventListener('keydown',keyboardClickCB);
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
                    var defer = $q.defer();
                    var swiperInstanceProm = defer.promise;

                    function preLink(scope,element,attrs,ngModelCtrl){
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
                                    swiperInstanceProm.then(function(swiperInstance){
                                        swiperInstance[fnName].apply(swiperInstance,fnArgs);
                                    });
                                };
                            });

                            actions.updateFollowingSlideAddition = function(){
                                return swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.updateContainerSize();
                                    swiperInstance.updateSlidesSize();
                                });
                            };
                        }

                        ngModelCtrl.$render = function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            if(angular.isNumber(currSlideIndex)){
                                swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.slideTo(currSlideIndex);
                                });
                            }
                        };

                        swiperInstanceProm.then(function(swiperInstance){
                            swiperInstance.on('onSlideChangeEnd',function(_swipeInstance){
                                ngModelCtrl.$setViewValue(_swipeInstance.activeIndex);
                            });
                        });

                        scope.$on('$destroy',function(){
                            swiperInstanceProm.then(function(swiperInstance){
                                swiperInstance.destroy();
                            });
                        });
                    }

                    function postLink(scope,element,attrs,ngModelCtrl){
                        $timeout(function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            defer.resolve(new Swiper(element[0], {
                                initialSlide: currSlideIndex || 0,
                                onlyExternal: true
                            }));
                        },0,false);
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

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSrv', [
        /*'ZnkModalSrv',*/ 'EnumSrv', '$window', 'PlatformEnum',
        function (/*ZnkModalSrv, */EnumSrv, $window, PlatformEnum) {
            var ZnkExerciseSrv = {};

            var platform = !!$window.ionic ? PlatformEnum.MOBILE.enum : PlatformEnum.DESKTOP.enum;
            ZnkExerciseSrv.getPlatform = function(){
                return platform;
            };

            ZnkExerciseSrv.openExerciseToolBoxModal = function openExerciseToolBoxModal(/*toolBoxModalSettings*/) {
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
            };

            ZnkExerciseSrv.toolBoxTools = {
                BLACKBOARD: 'blackboard',
                MARKER: 'mar',
                CALCULATOR: 'cal',
                BOOKMARK: 'bookmark',
                SHOW_PAGER: 'show pager'
            };

            return ZnkExerciseSrv;
        }
    ]);
})(angular);

/**
 * attrs:
 *  questions: questions array
 *
 *  ngModel: results array
 *
 *  settings:
 *      allowedTimeForExercise
 *      onDone
 *      onQuestionAnswered
 *      wrapperCls
 *      toolsToHide
 *      viewMode
 *      onExerciseReady
 *      onSlideChange
 *      initSlideIndex
 *      toolBoxWrapperClass
 *      initSlideDirection
 *      initForceDoneBtnDisplay: null-default behaviour(default value), false-done button will be hidden, true-done button will be dispalyed
 *      initPagerDisplay: true- displayed(default value), false- hidden
 *
 *  actions:
 *      setSlideIndex
 *      getCurrentIndex
 *      finishExercise
 *      setSlideDirection
 *      forceDoneBtnDisplay
 *      pagerDisplay: function, if true provided than pager will be displayed other it will be hidden.
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
                                ngModelCtrl.$setViewValue(angular.copy(scope.vm.questionsWithAnswers));
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

                                    questionCopy.__questionStatus= angular.copy(answer);
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

                            scope.$watch('vm.currentSlide', function (value, prevValue) {
                                if(angular.isUndefined(value)){
                                    return;
                                }

                                var currQuestion = getCurrentQuestion();

                                updateTimeSpentOnQuestion(prevValue);
                                if (toolboxModalSettings.actions && toolboxModalSettings.actions.setToolValue) {
                                    toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BOOKMARK, !!currQuestion.__questionStatus.bookmark);
                                }
                                //added since the sliders current was not changed yet
                                $timeout(function(){
                                    scope.settings.onSlideChange(currQuestion, value);
                                    scope.$broadcast(ZnkExerciseEvents.QUESTION_CHANGED,value ,prevValue ,currQuestion);
                                },0,false);
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
        '$scope', '$q', 'ZnkExerciseEvents', '$log', '$element',
        function ($scope, $q, ZnkExerciseEvents, $log, $element) {
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
                        //minimum index limit
                        newQuestionIndex = Math.max(0, newQuestionIndex);
                        //max index limit
                        var questions = $scope.questionsGetter() || [];
                        newQuestionIndex = Math.min(newQuestionIndex, questions.length - 1);

                        $scope.vm.currentSlide = newQuestionIndex;
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
        }]);
})(angular);

/**
 * attrs:
 *  questions
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
        '$timeout', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum',
        function ($timeout, ZnkExerciseEvents, ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExercisePagerDrv.html',
                restrict: 'E',
                require: ['ngModel', '^znkExercise'],
                scope: {},
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

                        function setPagerItemBookmarkStatus(index,status){
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
                            if(status){
                                pagerItemElement.addClass('bookmark');
                            }else{
                                pagerItemElement.removeClass('bookmark');
                            }
                        }

                        function setPagerItemAnswerClass(index,question){
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);

                            if(angular.isUndefined(question.__questionStatus.userAnswer)){
                                pagerItemElement.removeClass('neutral correct wrong');
                                return;
                            }

                            if(currViewMode === ZnkExerciseViewModeEnum.ONLY_ANSWER.enum){
                                pagerItemElement.addClass('neutral');
                                return;
                            }

                            if(question.__questionStatus.isAnsweredCorrectly){
                                pagerItemElement.addClass('correct');
                            }else{
                                pagerItemElement.addClass('wrong');
                            }
                        }

                        scope.$on(ZnkExerciseEvents.BOOKMARK,function(evt,question){
                            setPagerItemBookmarkStatus(question.__questionStatus.index,question.__questionStatus.bookmark);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED,function(evt,question){
                            setPagerItemAnswerClass(question.__questionStatus.index,question);
                        });

                        var isInitialized;
                        function init(){
                            isInitialized = true;
                            //wait for the pager items to be rendered
                            $timeout(function () {
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

                                        for(i in scope.questions){
                                            var question = scope.questions[i];
                                            setPagerItemBookmarkStatus(i,question .__questionStatus.bookmark);
                                            setPagerItemAnswerClass(i,question);
                                        }
                                    });
                                };
                                //render is not invoked for the first time
                                ngModelCtrl.$render();
                            },false);
                        }

                        scope.$parent.$watch(attrs.questions, function pagerQuestionsArrWatcher(questionsArr) {
                            if (questionsArr) {
                                scope.questions = questionsArr;

                                if(!isInitialized){
                                    init();
                                }
                            }
                        });
                    }
                }
            };
        }
    ]);
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

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseUtilitySrv', ['AnswerTypeEnum', '$log',
        function (AnswerTypeEnum, $log) {
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
                    if (!groupDataMap[question.groupDataId]) {
                        $log.debug('Group data is missing for the following question id ' + question.id);
                    }

                    question.groupData = groupDataMap[question.groupDataId] || {};
                });
            };

            return ZnkExerciseUtilitySrv;
        }
    ]);
})(angular);

angular.module('znk.infra.znkExercise').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkExercise/answerTypes/templates/freeTextAnswerDrv.html",
    "<div class=\"free-text-answer-wrapper\" ng-switch=\"showCorrectAnswer\">\n" +
    "\n" +
    "    <div ng-switch-when=\"true\" class=\"answer-status-wrapper\" ng-class=\"userAnswerStatus\">\n" +
    "        <div class=\"answer-status\">\n" +
    "            <div class=\"user-answer\">{{d.userAnswer}}</div>\n" +
    "            <svg-icon class=\"correct-icon\" name=\"correct\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"wrong\"></svg-icon>\n" +
    "        </div>\n" +
    "        <div class=\"correct-answer\">Correct answer: <span>{{correctAnswer}}</span></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div  ng-switch-when=\"false\" class=\"input-wrapper\">\n" +
    "        <input ng-model-options=\"{ getterSetter: true }\" ng-model=\"d.userAnswerGetterSetter\">\n" +
    "        <div class=\"arrow-wrapper\" ng-click=\"clickHandler()\">\n" +
    "            <svg-icon name=\"arrow\"></svg-icon>\n" +
    "            <div class=\"svg-back\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/answerTypes/templates/rateAnswerDrv.html",
    "<div class=\"rate-answer-wrapper\">\n" +
    "\n" +
    "    <div class=\"checkbox-items-wrapper\" >\n" +
    "\n" +
    "        <div class=\"item-repeater\" ng-repeat=\"item in d.itemsArray track by $index\">\n" +
    "            <svg-icon class=\"correct-icon\" name=\"correct\"></svg-icon>\n" +
    "            <svg-icon class=\"wrong-icon\" name=\"wrong\"></svg-icon>\n" +
    "            <div class=\"checkbox-item\" ng-click=\"clickHandler($index)\">\n" +
    "                <div class=\"item-index\">{{$index +  2}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"correct-answer-line\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/answerTypes/templates/selectAnswerDrv.html",
    "<div ng-repeat=\"answer in ::d.answers track by answer.id\"\n" +
    "     class=\"answer\"\n" +
    "     ng-click=\"d.click(answer)\"\n" +
    "     tabindex=\"-1\">\n" +
    "    <div class=\"content-wrapper\">\n" +
    "        <div class=\"answer-index-wrapper\">\n" +
    "            <span class=\"index-char\">{{::d.getIndexChar($index)}}</span>\n" +
    "        </div>\n" +
    "        <markup content=\"answer.content\" type=\"md\" class=\"content\"></markup>\n" +
    "        <svg-icon class=\"correct-icon-drv\" name=\"correct\"></svg-icon>\n" +
    "        <svg-icon class=\"wrong-icon-drv\" name=\"wrong\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/btnSectionDesktopTemplate.html",
    "<div class=\"btn-container left-container ng-hide\"\n" +
    "     ng-show=\"!!vm.currentQuestionIndex && vm.slideRightAllowed\">\n" +
    "    <button ng-click=\"vm.prevQuestion()\">\n" +
    "        <svg-icon name=\"chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"btn-container right-container ng-hide\"\n" +
    "     ng-show=\"vm.maxQuestionIndex !== vm.currentQuestionIndex && vm.slideLeftAllowed\"\n" +
    "     ng-class=\"{'question-answered': vm.isCurrentQuestionAnswered}\">\n" +
    "    <button ng-click=\"vm.nextQuestion()\">\n" +
    "        <svg-icon name=\"chevron\"></svg-icon>\n" +
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
    "<znk-swiper class=\"znk-carousel\"\n" +
    "            ng-model=\"vm.currSlideIndex\"\n" +
    "            actions=\"vm.swiperActions\"\n" +
    "            ng-change=\"vm.SlideChanged()\"\n" +
    "            disable-swipe=\"{{vm.isLocked}}\">\n" +
    "    <div class=\"swiper-slide\"\n" +
    "        ng-repeat=\"question in vm.questions \">\n" +
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
    "");
  $templateCache.put("components/znkExercise/core/template/znkExercisePagerDrv.html",
    "<znk-scroll>\n" +
    "    <div class=\"pager-items-wrapper\">\n" +
    "        <div class=\"pager-item noselect\"\n" +
    "             ng-repeat=\"question in questions track by question.id\"\n" +
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
    "<svg x=\"0px\" y=\"0px\" viewBox=\"0 0 143.5 65.5\" xmlns=\"http://www.w3.org/2000/svg\" class=\"chevron-icon\">\n" +
    "    <style>\n" +
    "        .chevron-icon{\n" +
    "            width: 33px;\n" +
    "            height:auto;\n" +
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
}]);
