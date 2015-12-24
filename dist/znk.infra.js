(function (angular) {
    'use strict';

    angular.module('znk.infra', [
        'znk.infra.pngSequence',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'znk.infra.general',
        'znk.infra.scroll',
        'znk.infra.content',
        'znk.infra.znkExercise'
    ]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.content', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.enum', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.general', ['znk.infra.enum']);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', ['znk.infra.enum', 'znk.infra.svgIcon', 'angular-carousel'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    chevron: 'components/znkExercise/svg/chevron-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);
'use strict';

(function (angular) {

    function ContentSrv() {

        var setContentFuncRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.$get = ['$q', '$injector', function($q, $injector) {

            function _getContentData() {
                var contentData;
                return function() {
                    return {
                        get: function() {
                            if(!contentData) {
                                return _getContentFunc().then(function(dataObj) {

                                    contentData = dataObj;
                                    contentData.updatePublication(function(updatePublication) {
                                        if(updatePublication.key() !== contentData.key) {
                                            contentData.latestRevisions = updatePublication.val();
                                            contentData.key = updatePublication.key();
                                        }
                                    });
                                    return dataObj;
                                });
                            }
                            return $q.when(contentData);
                        },
                        set: function(practiceName, newData) {
                            contentData.revisionManifest[practiceName] = newData;
                            return $q.when({ rev: newData.rev, status: 'update'});
                        }
                    };
                };
            }

            var contentFunc;

            var contentDataFunc = _getContentData();

            var ContentSrv = {};

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            ContentSrv.getRev = function(practiceName, dataObj) {

                if(!dataObj || !dataObj.revisionManifest || !dataObj.latestRevisions) {
                    return $q.when({ error: 'No Data Found! ', data: dataObj });
                }

                var userManifest = dataObj.revisionManifest[practiceName];
                var publicationManifest = dataObj.latestRevisions[practiceName];
                var newRev;

                if(angular.isUndefined(publicationManifest)) {
                    return $q.when({ error: 'Not Found', data: dataObj });
                }

                if(!userManifest) {
                    newRev = { rev:  publicationManifest.rev, status: 'new' };
                } else if(userManifest.rev < publicationManifest.rev) {
                    newRev = { rev:  userManifest.rev, status: 'old' };
                } else if(userManifest.rev === publicationManifest.rev) {
                    newRev = { rev:  publicationManifest.rev, status: 'same' };
                } else {
                    newRev = { error: 'failed to get revision!', data: dataObj };
                }

                return $q.when(newRev);
            };

            ContentSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            // { exerciseId: 10, exerciseType: 'drill' }
            ContentSrv.getContent = function(pathObj) {

                if(!pathObj || !pathObj.exerciseId || !pathObj.exerciseType) {
                    return $q.when({ error: 'Error: getContent require exerciseId and exerciseType!' });
                }

                var path = pathObj.exerciseType+pathObj.exerciseId;

                return contentDataFunc().get().then(function(dataObj) {

                    return ContentSrv.getRev(path, dataObj).then(function(result) {

                        if(result.error) {
                            return $q.when(result);
                        }

                        if(!dataObj.contentRoot) {
                            return $q.when({ error: 'Error: getContent require contentRoot to be defined in config phase!' });
                        }

                        if(!dataObj.userRoot) {
                            return $q.when({ error: 'Error: getContent require userRoot to be defined in config phase!' });
                        }

                        var contentPath = dataObj.contentRoot+path+'-rev-'+result.rev;

                        var content =  dataObj.create(contentPath);

                        if(result.status === 'new') {
                            ContentSrv.setRev(path, result.rev).then(function() {
                                var userPath = dataObj.userRoot+'/revisionManifest/'+path;
                                var setUserRevision = dataObj.create(userPath);
                                setUserRevision.set({ rev : result.rev });
                            });
                        }

                        return content.get();

                    });
                });
            };

            return ContentSrv;
        }];
    }

    angular.module('znk.infra.content').provider('ContentSrv', ContentSrv);

})(angular);
(function (angular) {
    'use strict';

    var exerciseStatusEnum = {
        NEW: 0,
        ACTIVE: 1,
        COMPLETED: 2,
        COMING_SOON: 3
    };

    angular.module('znk.infra.enum').constant('exerciseStatusConst', exerciseStatusEnum);

    angular.module('znk.infra.enum').factory('ExerciseStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NEW', exerciseStatusEnum.NEW, 'new'],
                ['ACTIVE', exerciseStatusEnum.ACTIVE, 'active'],
                ['COMPLETED', exerciseStatusEnum.COMPLETED, 'completed'],
                ['COMING_SOON', exerciseStatusEnum.COMING_SOON, 'coming soon']
            ]);
        }
    ]);
})(angular);
(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        READING: 1,
        WRITING: 2,
        LISTENING: 3,
        SPEAKING: 4,
        ENGLISH: 5,
        SCIENCE: 6
    };

    angular.module('znk.infra.enum').constant('SubjectEnumConst', subjectEnum);

    angular.module('znk.infra.enum').factory('SubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var SubjectEnum = new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['READING', subjectEnum.READING, 'reading'],
                ['WRITING', subjectEnum.WRITING, 'writing'],
                ['LISTENING', subjectEnum.LISTENING, 'listening'],
                ['SPEAKING', subjectEnum.SPEAKING, 'speaking'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english'],
                ['SCIENCE', subjectEnum.SCIENCE, 'science']
            ]);

            return SubjectEnum;
        }
    ]);
})(angular);

'use strict';
(function (angular) {
    angular.module('znk.infra.enum').factory('EnumSrv', [
        function () {
            var EnumSrv = {};

            function BaseEnum(enumsArr) {
                var NAME_INDEX = 0;
                var ENUM_INDEX = 1;
                var VALUE_INDEX = 2;
                var self = this;
                enumsArr.forEach(function (item) {
                    self[item[NAME_INDEX]] = {
                        enum: item[ENUM_INDEX],
                        val: item[VALUE_INDEX]
                    };
                });
            }

            EnumSrv.BaseEnum = BaseEnum;

            BaseEnum.prototype.getEnumMap = function getEnumMap() {
                var enumsObj = this;
                var enumMap = {};
                var enumsPropKeys = Object.keys(enumsObj);
                for (var i in enumsPropKeys) {
                    var prop = enumsPropKeys[i];
                    var enumObj = enumsObj[prop];
                    enumMap[enumObj.enum] = enumObj.val;
                }
                return enumMap;
            };

            BaseEnum.prototype.getEnumArr = function getEnumArr() {
                var enumsObj = this;
                var enumArr = [];
                for (var prop in enumsObj) {
                    var enumObj = enumsObj[prop];
                    if (angular.isObject(enumObj)) {
                        enumArr.push(enumObj);
                    }
                }
                return enumArr;
            };

            EnumSrv.flashcardStatus = new BaseEnum([
                ['keep', 0, 'Keep'],
                ['remove', 1, 'Remove']
            ]);

            return EnumSrv;
        }
    ]);
})(angular);

/**
 * attrs:
 *  subject-id-to-class-drv: expression from which subject id will be taken from.
 *  class-suffix: suffix of the added class
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToClassDrv', [
        'SubjectEnum',
        function (SubjectEnum) {
            return {
                priority: 1000,
                link: {
                    pre: function (scope, element, attrs) {
                        var watchDestroyer = scope.$watch(attrs.subjectIdToClassDrv,function(subjectId){
                            if(angular.isUndefined(subjectId)){
                                return;
                            }

                            watchDestroyer();
                            var classToAdd;

                            for(var prop in SubjectEnum){
                                if(SubjectEnum[prop].enum === subjectId){
                                    classToAdd = SubjectEnum[prop].val;
                                    if(attrs.classSuffix){
                                        classToAdd += attrs.classSuffix;
                                    }
                                    break;
                                }
                            }

                            element.addClass(classToAdd);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * Created by Igor on 8/19/2015.
 */
/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence').directive('pngSequence', [
        '$timeout', 'ExpansionSrcSrv', '$window',
        function ($timeout, ExpansionSrcSrv, $window) {
            return {
                restrict: 'E',
                scope:{
                    onEnded: '&',
                    loop: '&',
                    speed:'&',
                    autoPlay: '&',
                    actions: '='
                },
                link: function (scope, element, attrs) {

                    var indexBound;

                    var requestID;

                    function buildComponent(){
                        var startIndex = +attrs.startIndex;
                        var endIndex = +attrs.endIndex;
                        var imageNum;
                        indexBound = endIndex - startIndex;
                        for(var i = startIndex; i < endIndex ; i++){
                            if(i < 100 || i < 10){
                                imageNum = i < 10 ? '00' + i :'0' + i;
                            }else{
                                imageNum = i;
                            }

                            var htmlTemplate = '<div ' +
                                    /* jshint validthis: true */
                                ' style="background-image: url(\'' + ExpansionSrcSrv.getExpansionSrc(attrs.imgData + imageNum + '.png') + '\'); background-size: cover; will-change: opacity; opacity:0; position: absolute; top:0; left:0;"></div>';

                            element.append(htmlTemplate);
                        }
                    }

                    function destroyCurrent(){
                        element.empty();
                    }

                    function PngAnimation() {
                        this.index = 0;
                        this.imagesDomElem = element[0].children;
                        this.lastTimestamp = false;
                    }


                    function animatePlay(timestamp) {
                        /* jshint validthis: true */
                        if(this.index === indexBound-1 && !scope.loop()){
                            $timeout(function(){
                                var children = element.children();
                                angular.element(children[children.length - 1]).css('display', 'none');
                                scope.onEnded();
                            });
                        }else{
                            if(this.lastTimestamp && (timestamp - this.lastTimestamp) < 40) {
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            } else {
                                this.imagesDomElem[this.index].style.opacity   =  0;
                                this.index = (this.index+1) % indexBound;
                                this.imagesDomElem[this.index].style.opacity   =  1;
                                this.lastTimestamp = timestamp;
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            }
                        }

                    }

                    function observeHandler(){
                        destroyCurrent();
                        if(attrs.imgData && angular.isDefined(attrs.startIndex)&& attrs.endIndex){
                            buildComponent();
                            if(scope.autoPlay()){
                                var animateInstance = new PngAnimation();
                                requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                            }
                        }
                    }

                    function watchFn(){
                        return attrs.imgData + '_' + attrs.startIndex + '_' + attrs.endIndex + '_' + attrs.rotate;
                    }
                    scope.$watch(watchFn,observeHandler);

                    scope.actions = scope.actions || {};
                    scope.actions.play = function(){
                        //added in order for the build function to be executed before the play
                        $timeout(function(){
                            var animateInstance = new PngAnimation();
                            requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                        },0,false);
                    };
                    scope.actions.reset = destroyCurrent;

                    scope.$on('$destroy',function(){
                        $window.cancelAnimationFrame(requestID);
                    });
                }
            };
        }
    ]);
})(angular);
/**
 * attrs:
 *      actions:
 *          animate: function (scrollTo,animationDuration,transition)
 *      scrollOnMouseWheel: whether to scroll on mouse wheel default false
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll').directive('znkScroll', [
        '$log', '$window', '$timeout', '$interpolate',
        function ($log, $window, $timeout, $interpolate) {
            function setElementTranslateX(element,val,isOffset,minVal,maxVal){
                var domElement = angular.isArray(element) ? element[0] : element;
                var newTranslateX = val;
                if(isOffset){
                    var currTransformVal = domElement.style.transform;
                    var currXMatchRegex = currTransformVal.match(/translateX\((.*)px\)/);
                    var currX;
                    if(!angular.isArray(currXMatchRegex ) || currXMatchRegex.length < 2){
                        $log.debug('failed to math transform value');
                        currX = 0;
                    }else{
                        currX = +currXMatchRegex[1];
                    }
                    newTranslateX += currX;
                }
                minVal = angular.isUndefined(minVal) ? -Infinity : minVal;
                maxVal = angular.isUndefined(maxVal) ? Infinity : maxVal;

                newTranslateX = Math.max(newTranslateX,minVal);
                newTranslateX = Math.min(newTranslateX,maxVal);

                var newTransformValue = 'translateX(' + newTranslateX + 'px)';
                setCssPropery(domElement,'transform',newTransformValue);
            }

            function setCssPropery(element,prop,value){
                var domElement = angular.isArray(element) ? element[0] : element;
                if(value === null){
                    domElement.style[prop] = '';
                }else{
                    domElement.style[prop] = value;
                }
            }

            function getElementWidth(element){
                var domElement = angular.isArray(element) ? element[0] : element;

                var domElementStyle  = $window.getComputedStyle(domElement);
                var domElementMarginRight = +domElementStyle.marginRight.replace('px','');
                var domElementMarginLeft = +domElementStyle.marginLeft.replace('px','');
                return domElement .offsetWidth + domElementMarginRight + domElementMarginLeft;
            }

            return {
                restrict: 'E',
                compile: function(element){
                    var domElement = element[0];
                    var child = domElement.children[0];

                    var currMousePoint;
                    var containerWidth;
                    var childWidth;
                    function mouseMoveEventHandler(evt){
                        $log.debug('mouse move',evt.pageX);
                        var xOffset = evt.pageX - currMousePoint.x;
                        //var yOffset = evt.pageY - currMousePoint.y;

                        currMousePoint.x = evt.pageX;
                        currMousePoint.y = evt.pageY;
                        moveScroll(xOffset,containerWidth,childWidth);
                    }
                    function mouseUpEventHandler(evt){
                        $log.debug('mouse up',evt.pageX);
                        document.removeEventListener('mousemove',mouseMoveEventHandler);
                        document.removeEventListener('mouseup',mouseUpEventHandler);
                        containerWidth = null;
                        childWidth = null;
                        currMousePoint = null;
                    }
                    function mouseDownHandler(evt){
                        $log.debug('mouse down',evt.pageX);

                        containerWidth = domElement.offsetWidth;
                        childWidth = getElementWidth(domElement.children[0]);

                        currMousePoint = {
                            x: evt.pageX,
                            y: evt.pageY
                        };


                        document.addEventListener('mousemove',mouseMoveEventHandler);

                        document.addEventListener('mouseup',mouseUpEventHandler);
                    }
                    domElement.addEventListener('mousedown',mouseDownHandler);

                    function moveScroll(xOffset, containerWidth, childWidth/*,yOffset*/){
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;

                        if(!child.style.transform){
                            setElementTranslateX(child,0,false,false,minTranslateX,maxTranslateX);
                        }

                        setElementTranslateX(child,xOffset,true,minTranslateX,maxTranslateX);
                    }

                    function setScrollPos(scrollX){
                        var containerWidth = domElement.offsetWidth;
                        var childWidth = getElementWidth(child);
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;
                        setElementTranslateX(child,scrollX,false,minTranslateX,maxTranslateX);
                    }

                    return {
                        pre: function(scope,element,attrs){
                            var child = domElement.children[0];
                            setElementTranslateX(child,0);

                            var scrollOnMouseWheel = $interpolate(attrs.scrollOnMouseWheel || '')(scope) !== 'false';
                            var containerWidth,childWidth;
                            function mouseWheelEventHandler(evt){
                                $log.debug('mouse wheel event',evt);
                                moveScroll(-evt.deltaY, containerWidth, childWidth);
                            }
                            function mouseEnterEventHandler(){
                                $log.debug('mouse enter');
                                containerWidth = domElement.offsetWidth;
                                childWidth = getElementWidth(domElement.children[0]);
                                domElement.addEventListener('mousewheel',mouseWheelEventHandler);
                            }
                            function mouseUpEventHandler(){
                                $log.debug('mouse leave');
                                domElement.removeEventListener('mousewheel',mouseWheelEventHandler);
                            }
                            if(scrollOnMouseWheel){
                                domElement.addEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.addEventListener('mouseleave',mouseUpEventHandler);
                            }

                            if(attrs.actions){
                                if(angular.isUndefined(scope.$eval(attrs.actions))){
                                    scope.$eval(attrs.actions + '={}');
                                }
                                var actions = scope.$eval(attrs.actions);

                                actions.animate = function(scrollTo,transitionDuration,transitionTimingFunction){
                                    if(transitionDuration && transitionTimingFunction){
                                        var transitionPropVal = 'transform ' + transitionDuration + 'ms ' + transitionTimingFunction;
                                        setCssPropery(child,'transition',transitionPropVal);
                                    }
                                    setScrollPos(scrollTo);
                                    //@todo(igor) may be out of sync
                                    $timeout(function(){
                                        setCssPropery(child,'transition',null);
                                    },transitionDuration,false);
                                };
                            }

                            scope.$on('$destroy',function(){
                                document.removeEventListener('mousemove',mouseMoveEventHandler);
                                document.removeEventListener('mouseup',mouseUpEventHandler);
                                domElement.removeEventListener('mousedown',mouseDownHandler);
                                domElement.removeEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.removeEventListener('mouseleave',mouseUpEventHandler);
                                domElement.removeEventListener('mousewheel',mouseWheelEventHandler);
                            });
                        }
                    };

                }
            };
        }
    ]);

})(angular);


/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').directive('svgIcon', [
        '$log', 'SvgIconSrv',
        function ($log, SvgIconSrv) {
            return {
                scope: {
                    name: '@'

                },
                link: {
                    pre: function (scope, element) {
                        var name = scope.name;
                        if (!name) {
                            $log.error('svgIcon directive: name attribute was not set');
                            return;
                        }
                        element.addClass(name);
                        SvgIconSrv.getSvgByName(name).then(function (svg) {
                            element.append(svg);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', [
        function () {
            var defaultConfig = {};
            this.setConfig = function (_config) {
                angular.extend(defaultConfig, _config);
            };

            var svgMap = {};
            this.registerSvgSources = function (_svgMap) {
                var alreadyRegisteredSvgIconNames = Object.keys(svgMap);
                alreadyRegisteredSvgIconNames.forEach(function(svgIconName){
                    if(!!_svgMap[svgIconName]){
                        console.log('SvgIconSrv: svg icon was already defined before ',svgIconName);
                    }
                });
                angular.extend(svgMap,_svgMap);
                return true;
            };

            var getSvgPromMap = {};

            this.$get = [
                '$templateCache', '$q', '$http',
                function ($templateCache, $q, $http) {
                    var SvgIconSrv = {};

                    SvgIconSrv.getSvgByName = function (name) {
                        var src = svgMap[name];

                        if(getSvgPromMap[src]){
                            return getSvgPromMap[src];
                        }

                        var fromCache = $templateCache.get(src);
                        if(fromCache){
                            return $q.when(fromCache);
                        }

                        var getSvgProm =  $http.get(src).then(function(res){
                            $templateCache.put(src,res.data);
                            delete getSvgPromMap[src];
                            return res.data;
                        });
                        getSvgPromMap[src] = getSvgProm;

                        return getSvgProm;
                    };

                    return SvgIconSrv;
                }
            ];
        }]);
})(angular);

///**
// * attrs:
// */
//
//(function (angular) {
//    'use strict';
//
//    angular.module('znk.infra.znkExercise').directive('freeTextAnswerDrv', [
//        'ZnkExerciseDrvSrv', 'MediaSrv', 'SubjectEnumConst',
//        function (ZnkExerciseDrvSrv, MediaSrv, SubjectEnumConst) {
//            return {
//                templateUrl: 'scripts/exercise/templates/freeTextAnswerDrv.html',
//                require: ['^simpleQuestion','^ngModel'],
//                scope:{},
//                link: function (scope, element, attrs, ctrls) {
//                    var questionDrvCtrl = ctrls[0];
//                    var ngModelCtrl = scope.ngModelCtrl = ctrls[1];
//
//
//                    scope.d = {
//                        showSolution: questionDrvCtrl.showSolution,
//                        ngModelCtrl: ngModelCtrl,
//                        numOfGridCells: questionDrvCtrl.question.subjectId === SubjectEnumConst.LISTENING ? 2 : 3
//                    };
//
//                    updateCanEdit();
//
//                    function isCorrect(flatAnswer) {
//                        var correctAnswersArr = questionDrvCtrl.question.correctAnswerText.map(function(answer){
//                            return answer.content;
//                        });
//
//                        return correctAnswersArr.indexOf(flatAnswer);
//                    }
//
//                    /**
//                     * Returns the first correct answer, formatted as comma seperated values
//                     * @return {string} correct answers
//                     */
//                    function getFirstCorrectAnswer() {
//                        // '341' -> '3, 4, 1'
//                        if(questionDrvCtrl.question.correctAnswerText[0].content){
//                            return questionDrvCtrl.question.correctAnswerText[0].content.match(/.{1}/g).join(', ');
//                        }else{
//                            console.log('content problem in free text question');
//                        }
//
//                    }
//
//                    function setCorrectnessClass(enableSound){
//
//                        scope.d.currentAnswer = ngModelCtrl.$viewValue && ngModelCtrl.$viewValue.indexOf(', ') === -1 ?  ngModelCtrl.$viewValue.match(/.{1}/g).join(',') : ngModelCtrl.$viewValue;
//                        var viewMode = questionDrvCtrl.getViewMode();
//                        var classToAdd;
//
//                        if((viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && angular.isUndefined(scope.d.answer)) ||
//                            viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerOnly.enum || viewMode === ZnkExerciseDrvSrv.viewModeEnum.mustAnswer.enum){
//                            classToAdd = 'neutral';
//
//                        } else {
//                            if (isCorrect(scope.d.answer) === -1) {
//                                var $questionCorrectAnswer = angular.element(element[0].querySelector('.question-correct-answer'));
//                                $questionCorrectAnswer.empty();
//                                $questionCorrectAnswer.html(getFirstCorrectAnswer());
//
//                                if(angular.isUndefined(scope.d.answer)){
//                                    classToAdd = 'not-answered';
//                                }else{
//                                    classToAdd = 'wrong';
//                                }
//                            } else {
//                                classToAdd = 'correct';
//                            }
//
//                            if (viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && enableSound){
//                                if (classToAdd === 'correct'){
//                                    MediaSrv.playCorrectAnswerSound();
//                                }
//                                if (classToAdd === 'wrong'){
//                                    MediaSrv.playWrongAnswerSound();
//                                }
//                            }
//                        }
//
//                        element.addClass(classToAdd);
//                    }
//
//                    function updateCanEdit() {
//                        var viewMode = questionDrvCtrl.getViewMode();
//                        scope.d.disableEdit = (viewMode === ZnkExerciseDrvSrv.viewModeEnum.review.enum ||
//                            (viewMode === ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum && scope.d.answer));
//                    }
//
//                    scope.d.save = function(){
//                        ngModelCtrl.$setViewValue(scope.d.answer);
//                        setCorrectnessClass(true);
//                        updateCanEdit();
//                    };
//
//                    ngModelCtrl.$render = function(){
//                        scope.d.answer = ngModelCtrl.$viewValue;
//                        setCorrectnessClass(false);
//                        updateCanEdit();
//                    };
//
//                    scope.$on('exercise:viewModeChanged', function () {
//                        updateCanEdit();
//                        ngModelCtrl.$render();
//                    });
//
//                    scope.$watch('d.answer', function() {
//                        scope.d.save();
//                    });
//                }
//            };
//        }
//    ]);
//})(angular);
//

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

    angular.module('znk.infra.znkExercise').directive('freeTextAnswerGrid', function() {
        return {
            templateUrl: 'scripts/exercise/templates/freeTextAnswerGridDrv.html',
            restrict: 'E',
            require: 'ngModel',
            scope: {
                cellsNumGetter: '&cellsNum'
            },
            link: function(scope,element,attrs,ngModelCtrl){

                scope.buttonArray= [1,2,3,4,5,6,7,8,9];

                var numberOfCells  = scope.cellsNumGetter() || 3;

                scope.d = {
                    viewCells: new Array(numberOfCells)
                };

                function updateNgModelViewValue(){
                    ngModelCtrl.$setViewValue(angular.copy(scope.d.cells));
                }

                scope.onClickNum = function (num) {
                    if(attrs.disabled || scope.d.cells.length >= numberOfCells){
                        return;
                    }

                    scope.d.cells.push(num);
                    updateNgModelViewValue();
                };

                scope.onClickErase = function(){
                    if(attrs.disabled || !scope.d.cells.length){
                        return;
                    }

                    scope.d.cells.pop();
                    updateNgModelViewValue();
                };

                ngModelCtrl.$render = function(){
                    scope.d.cells = angular.isDefined(ngModelCtrl.$viewValue) ?  ngModelCtrl.$viewValue : [];
                };
            }
        };
    });
}(angular));

/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('selectAnswerDrv', [
        '$timeout', 'ZnkExerciseDrvSrv', 'MediaSrv',
        function ($timeout, ZnkExerciseDrvSrv, MediaSrv) {
            return {
                templateUrl: 'scripts/exercise/templates/selectAnswerDrv.html',
                require: ['^simpleQuestion', '^ngModel'],
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var questionDrvCtrl = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseDrvSrv.viewModeEnum.answerWithResult.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseDrvSrv.viewModeEnum.answerOnly.enum,
                        MODE_REVIEW = ZnkExerciseDrvSrv.viewModeEnum.review.enum,
                        MODE_MUST_ANSWER = ZnkExerciseDrvSrv.viewModeEnum.mustAnswer.enum;

                    scope.d = {};

                    scope.d.answers = questionDrvCtrl.question.answers;

                    scope.d.showSolution = questionDrvCtrl.showSolution;

                    scope.d.tap = function (answer) {
                        var viewMode = questionDrvCtrl.getViewMode();

                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    function updateAnswersFollowingSelection(viewMode) {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = questionDrvCtrl.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {

                            var $answerElem = angular.element($answers[i]);
                            if(!$answerElem || !$answerElem.scope || !$answerElem.scope()){
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (questionDrvCtrl.getViewMode() === MODE_ANSWER_ONLY || questionDrvCtrl.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (questionDrvCtrl.getViewMode() === MODE_REVIEW) {
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
                                    MediaSrv.playCorrectAnswerSound();
                                }
                                if (classToAdd === 'wrong'){
                                    MediaSrv.playWrongAnswerSound();
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
        READY: 'znk exercise: exercise ready'
    };
    angular.module('znk.infra.znkExercise').constant('ZnkExerciseEvents', ZnkExerciseEvents);
})(angular);

/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    var typeToViewMap = {
        0: '<div select-answer-drv></div>',
        1: '<div free-text-answer-drv></div>'
    };
    angular.module('znk.infra.znkExercise').directive('answersBuilderDrv', [
        '$compile',
        function ($compile) {
            return {
                require: '^simpleQuestion',
                link: function (scope, element, attrs, questionCtrl) {
                    var answerType = questionCtrl.question.answerTypeId;
                    var answerHtml = typeToViewMap[answerType];
                    element.html(answerHtml);
                    $compile(element.contents())(scope);
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

    angular.module('znk.infra.znkExercise').directive('questionBuilder', [
        '$compile', 'QuestionTypesSrv', '$timeout',
        function ($compile, QuestionTypesSrv, $timeout) {
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

                        questionBuilderCtrl.getViewMode = znkExerciseCtrl.getViewMode;
                        questionBuilderCtrl.questionChangeResolver = znkExerciseCtrl.questionChangeResolver.bind(znkExerciseCtrl);
                    },
                    post: function post(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];
                        var questionHtmlTemplate = QuestionTypesSrv.getQuestionHtmlTemplate(questionBuilderCtrl.question);
                        element.append(questionHtmlTemplate);
                        var childScope = scope.$new(true);
                        $compile(element.contents())(childScope);

                        //after 2 digests at max the question should be randered
                        var innerTimeout;
                        $timeout(function(){
                            innerTimeout = $timeout(function(){
                                znkExerciseCtrl.notifyQuestionReady(questionBuilderCtrl.question.__questionStatus.index);
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
 *  prev-question
 *  next-question
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    questionsGetter: '&questions'
                },
                require: ['znkExerciseBtnSection', '^znkExercise'],
                controllerAs: 'vm',
                controller: [
                    '$scope',
                    function ($scope) {
                        this.prevQuestion = function () {
                            $scope.prevQuestion();
                        };

                        this.nextQuestion = function () {
                            $scope.nextQuestion();
                        };
                    }
                ],
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
                link: function (scope, element, attrs, ctrls) {
                    var znkExerciseDrvCtrl = ctrls[1];

                    znkExerciseDrvCtrl.getQuestions().then(function(questions){
                        scope.$parent.$watch(attrs.activeSlide, function(newVal){
                            if((newVal && newVal === (questions.length -1 )) || znkExerciseDrvCtrl.isLastUnansweredQuestion()){
                                scope.vm.showDoneButton = true;
                            }else{
                                scope.vm.showDoneButton = false;
                            }
                        });
                    });


                    scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                        if(znkExerciseDrvCtrl.isLastUnansweredQuestion()){
                            scope.vm.showDoneButton = true;
                        }
                    });
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
            '$log',
            function ($log) {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(question) {
                    var questionTypeId = questionTypeGetterFn(question);
                    if(!questionTypeToHtmlTemplateMap[questionTypeId]){
                        $log.error('QuestionTypesSrv: Template was not registered for the following question type:',questionTypeId);
                    }
                    return questionTypeToHtmlTemplateMap[questionTypeId];
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

            //ZnkExerciseSrv.viewModeEnum = new EnumSrv.BaseEnum([
            //    ['answerWithResult', 1, 'Answer With Result'],
            //    ['answerOnly', 2, 'Answer Only'],
            //    ['review', 3, 'Review'],
            //    ['mustAnswer', 4, 'Must Answer']
            //]);

            ZnkExerciseSrv.toolBoxTools = {
                BLACKBOARD: 'blackboard',
                MARKER: 'mar',
                CALCULATOR: 'cal',
                BOOKMARK: 'bookmark',
                SHOW_PAGER: 'show pager'
            };

            ZnkExerciseSrv.slideDirections = {
                NONE: 'none',
                ALL: 'all',
                RIGHT: 'right',
                LEFT: 'left'
            };

            return ZnkExerciseSrv;
        }
    ]);
})(angular);

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
                                onNext: function () {
                                    scope.d.currentSlide++;
                                },
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
                                currentSlide: scope.settings.initSlideIndex || 0,
                                answeredCount: 0,
                                slideDirections: ZnkExerciseSrv.slideDirections
                            };

                            scope.actions = scope.actions || {};
                            scope.actions.setSlideIndex = function setSlideIndex(index) {
                                scope.d.currentSlide = index;
                            };
                            scope.actions.getCurrentIndex = function () {
                                return scope.d.currentSlide;
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

                                    ngModelCtrl.$modelValue[index] = answer;
                                });

                                return ngModelCtrl.$modelValue;
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
                            /**
                             * @deprecated
                             * use znkExerciseDrvCtrl setCurrentIndex or setCurrentIndexByOffset instead
                             * */
                            scope.d.next = function () {
                                var questionIndex = scope.d.currentSlide;
                                var lastQuestion = allQuestionWithAnswersArr[allQuestionWithAnswersArr.length - 1];
                                znkExerciseDrvCtrl.questionChangeResolver().then(function () {
                                    if (lastQuestion !== scope.d.questionsWithAnswers[questionIndex] && scope.d.answeredCount !== scope.d.questionsWithAnswers.length) {
                                        scope.settings.onNext();
                                    } else {
                                        updateTimeSpentOnQuestion();
                                        setViewValue();
                                        scope.settings.onDone();
                                    }
                                    questionAnswered = false;
                                });
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


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseDrvCtrl', [
        '$scope', '$q', 'ZnkExerciseEvents',
        function ($scope, $q, ZnkExerciseEvents) {
            var self = this;
            var exerciseReadyDefer = $q.defer();
            var isExerciseReady = false;

            self.setExerciseAsReady = function(){
                if(isExerciseReady){
                    return;
                }
                isExerciseReady = true;
                exerciseReadyDefer.resolve(isExerciseReady);
            };

            self.isExerciseReady = function(){
                return isExerciseReady ;
            };

            self.getViewMode = function () {
                return $scope.settings.viewMode;
            };

            self.getSlideDirection = function () {
                return $scope.settings.slideDirection;
            };

            //set resolver which control when to go to next question (if at all) when click on next button
            self.questionChangeResolver = (function () {
                var onNextResolver;
                return function (_onNextResolver) {
                    if (angular.isDefined(_onNextResolver)) {
                        onNextResolver = _onNextResolver;
                    }
                    return $q.when(onNextResolver);
                };
            })();

            self.getCurrentIndex = function () {
                return $scope.d.currentSlide;
            };

            self.setCurrentIndex = function (newQuestionIndex) {
                if (angular.isDefined(newQuestionIndex)) {
                    return self.questionChangeResolver().then(function () {
                        $scope.d.currentSlide = newQuestionIndex;
                        return $scope.d.currentSlide;
                    });
                }
                return $q.when($scope.d.currentSlide);
            };

            self.setCurrentIndexByOffset = function (offset) {
                var currIndex = this.getCurrentIndex();
                var newCurrIndex = currIndex + offset;
                //minimum index limit
                newCurrIndex = Math.max(0, newCurrIndex);
                //max index limit
                var questions = $scope.questionsGetter() || [];
                newCurrIndex = Math.min(newCurrIndex, questions.length - 1);

                return this.setCurrentIndex(newCurrIndex);
            };

            self.notifyQuestionReady = function () {
                if (!self.__exerciseReady) {
                    self.__exerciseReady = true;
                    $scope.$broadcast(ZnkExerciseEvents.READY);
                    exerciseReadyDefer.resolve(true);
                    if ($scope.settings.onExerciseReady) {
                        $scope.settings.onExerciseReady();
                    }
                }
            };

            self.isCurrentQuestionAnswered = function () {
                return isQuestionAnswered($scope.d.currentSlide);
            };

            self.isLastUnansweredQuestion = function(){
                var questionsNum = ($scope.d.questionsWithAnswers || []).length;
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
                return exerciseReadyDefer.promise.then(function(){
                    return $scope.d.questionsWithAnswers;
                });
            };

            function isQuestionAnswered(index) {
                var questionWithAnswer = $scope.d.questionsWithAnswers ? $scope.d.questionsWithAnswers[index] : {};
                return questionWithAnswer && questionWithAnswer.__questionStatus && angular.isDefined(questionWithAnswer.__questionStatus.userAnswer);
            }
        }]);
})(angular);
///**
// * attrs:
// *  questions
// */
//
//(function (angular) {
//    'use strict';
//
//    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
//        '$timeout', 'SubjectEnum', 'QuestionUtilsSrv', 'ZnkExerciseDrvSrv', 'ZnkExerciseEvents', '$ionicScrollDelegate',
//        function ($timeout, SubjectEnum, QuestionUtilsSrv, ZnkExerciseDrvSrv, ZnkExerciseEvents, $ionicScrollDelegate) {
//            return {
//                templateUrl: 'scripts/exercise/templates/znkExercisePagerDrv.html',
//                restrict: 'E',
//                require: ['ngModel', '^znkExercise'],
//                scope: {},
//                link: {
//                    pre: function (scope, element, attrs, ctrls) {
//                        var ngModelCtrl = ctrls[0];
//                        var znkExerciseCtrl = ctrls[1];
//
//                        var currViewMode = znkExerciseCtrl.getViewMode();
//
//                        var domElement = element[0];
//
//                        scope.d = {};
//
//                        scope.d.tap = function (index) {
//                            znkExerciseCtrl.__changeQuestionResolver().then(function(){
//                                ngModelCtrl.$setViewValue(index);
//                                ngModelCtrl.$render();
//                            });
//                        };
//
//                        function setPagerItemBookmarkStatus(index,status){
//                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
//                            if(status){
//                                pagerItemElement.addClass('bookmark');
//                            }else{
//                                pagerItemElement.removeClass('bookmark');
//                            }
//                        }
//
//                        function setPagerItemAnswerClass(index,question){
//                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
//
//                            if(angular.isUndefined(question.__questionStatus.userAnswer)){
//                                pagerItemElement.removeClass('neutral correct wrong');
//                                return;
//                            }
//
//                            if(question.subjectId === SubjectEnum.SPEAKING.enum || question.subjectId === SubjectEnum.WRITING.enum || ZnkExerciseDrvSrv.viewModeEnum.answerOnly.enum === currViewMode){
//                                pagerItemElement.addClass('neutral');
//                                return;
//                            }
//
//                            if(QuestionUtilsSrv.isAnswerCorrect(question,question.__questionStatus)){
//                                pagerItemElement.addClass('correct');
//                            }else{
//                                pagerItemElement.addClass('wrong');
//                            }
//                        }
//
//                        function setScroll(currentSlideDom) {
//                            var delegate = $ionicScrollDelegate.$getByHandle('znk-pager');
//                            var domElement = currentSlideDom[0];
//                            var parent = domElement.offsetParent;
//                            var res = (domElement.offsetLeft + domElement.scrollWidth) - (parent) ? parent.clientWidth : 0;
//                            if (res > 0) {
//                                delegate.scrollTo(res + domElement.scrollWidth, 0, true);
//                            } else {
//                                delegate.scrollTo(0, 0, true);
//                            }
//                        }
//
//                        scope.$on(ZnkExerciseEvents.BOOKMARK,function(evt,question){
//                            setPagerItemBookmarkStatus(question.__questionStatus.index,question.__questionStatus.bookmark);
//                        });
//
//                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED,function(evt,question){
//                            setPagerItemAnswerClass(question.__questionStatus.index,question);
//                        });
//
//                        var watchDestroyer = scope.$parent.$watch(attrs.questions, function pagerQuestionsArrWatcher(questionsArr) {
//                            if (questionsArr) {
//                                watchDestroyer();
//                                scope.questions = questionsArr;
//
//                                //wait for the pager items to be rendered
//                                $timeout(function () {
//                                    ngModelCtrl.$render = function () {
//                                        var currentSlide = +ngModelCtrl.$viewValue;
//                                        if (isNaN(currentSlide)) {
//                                            return;
//                                        }
//                                        //added in order to prevent the swipe lag
//                                        $timeout(function () {
//                                            var i;
//                                            var $pagerItemWithCurrentClass = angular.element(domElement.querySelectorAll('.pager-item.current'));
//                                            for (i in $pagerItemWithCurrentClass) {
//                                                $pagerItemWithCurrentClass.eq(i).removeClass('current');
//                                            }
//                                            var pagerItemsDomElement = domElement.querySelectorAll('.pager-item');
//                                            var currentSlideDom = angular.element(pagerItemsDomElement[currentSlide]);
//                                            currentSlideDom.addClass('current');
//
//                                            for(i in scope.questions){
//                                                var question = scope.questions[i];
//                                                setPagerItemBookmarkStatus(i,question .__questionStatus.bookmark);
//                                                setPagerItemAnswerClass(i,question);
//                                            }
//
//                                            setScroll(currentSlideDom);
//                                        });
//                                    };
//                                    //render is not invoked for the first time
//                                    ngModelCtrl.$render();
//                                },false);
//                            }
//                        });
//                    }
//                }
//            };
//        }
//    ]);
//})(angular);
//

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


angular.module('znk.infra').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkExercise/core/template/btnSectionDesktopTemplate.html",
    "<div class=\"btn-container left-container\">\n" +
    "    <button ng-click=\"vm.prevQuestion()\">\n" +
    "        <svg-icon name=\"chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"btn-container right-container\">\n" +
    "    <button ng-click=\"vm.nextQuestion()\">\n" +
    "        <svg-icon name=\"chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<button class=\"done-btn ng-hide\" ng-show=\"vm.showDoneButton\">DONE</button>");
  $templateCache.put("components/znkExercise/core/template/btnSectionMobileTemplate.html",
    "<div ng-class=\"{ 'next-disabled' : settings.slideDirection === d.slideDirections.NONE ||  settings.slideDirection === d.slideDirections.RIGHT }\">\n" +
    "    <div class=\"bookmark-icon-container only-tablet\"\n" +
    "         ng-class=\"d.questionsWithAnswers[d.currentSlide].__questionStatus.bookmark ? 'bookmark-active-icon' : 'bookmark-icon'\"\n" +
    "         ng-click=\"d.bookmarkCurrentQuestion()\"\n" +
    "         ng-hide=\"settings.viewMode === d.reviewModeId\"\n" +
    "         analytics-on=\"click\"\n" +
    "         analytics-event=\"click-bookmark-question\"\n" +
    "         analytics-category=\"exercise\"></div>\n" +
    "    <ng-switch\n" +
    "            on=\"d.currentSlide !== d.questionsWithAnswers.length - 1 && d.answeredCount !== d.questionsWithAnswers.length\"\n" +
    "            ng-hide=\"settings.viewMode === d.reviewModeId\"\n" +
    "            class=\"ng-hide\"\n" +
    "            ng-click=\"d.next()\">\n" +
    "        <button ng-switch-when=\"true\"\n" +
    "                class=\"btn next\">\n" +
    "            <div class=\"only-tablet\"\n" +
    "                 analytics-on=\"click\"\n" +
    "                 analytics-event=\"click-next\"\n" +
    "                 analytics-category=\"exercise\">\n" +
    "                <span>NEXT</span>\n" +
    "                <i class=\"question-arrow-right-icon\"></i>\n" +
    "            </div>\n" +
    "        </button>\n" +
    "        <button ng-switch-when=\"false\"\n" +
    "                class=\"btn finish\">\n" +
    "            <div analytics-on=\"click\"\n" +
    "                 analytics-event=\"click-finish\"\n" +
    "                 analytics-category=\"exercise\">DONE\n" +
    "            </div>\n" +
    "        </button>\n" +
    "    </ng-switch>\n" +
    "    <button class=\"btn sum ng-hide\"\n" +
    "            ng-click=\"settings.onSummary()\"\n" +
    "            ng-show=\"settings.viewMode === d.reviewModeId\"\n" +
    "            analytics-on=\"click\"\n" +
    "            analytics-event=\"click-summary\"\n" +
    "            analytics-category=\"exercise\">SUMMARY\n" +
    "    </button>\n" +
    "</div>");
  $templateCache.put("components/znkExercise/core/template/questionSwiperDesktopTemplate.html",
    "<ul class=\"znk-carousel\"\n" +
    "    rn-carousel\n" +
    "    rn-carousel-index=\"d.currentSlide\">\n" +
    "    <li class=\"slide\"\n" +
    "        ng-repeat=\"question in d.questionsWithAnswers\">\n" +
    "        <question-builder active-slide=\"d.currentSlide\"\n" +
    "                          question=\"question\"\n" +
    "                          ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                          ng-change=\"d.questionAnswered(question)\">\n" +
    "        </question-builder>\n" +
    "    </li>\n" +
    "</ul>");
  $templateCache.put("components/znkExercise/core/template/questionSwiperMobileTemplate.html",
    "<ion-slide-box znk-slide=\"settings.slideDirection\" class=\"znk-carousel\"\n" +
    "               show-pager=\"false\"\n" +
    "               active-slide=\"d.currentSlide\">\n" +
    "    <question-builder slide-repeat-drv=\"question in d.questionsWithAnswers\"\n" +
    "                      active-slide=\"d.currentSlide\"\n" +
    "                      question=\"question\"\n" +
    "                      ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                      ng-change=\"d.questionAnswered(question)\">\n" +
    "    </question-builder>\n" +
    "</ion-slide-box>");
  $templateCache.put("components/znkExercise/core/template/znkExerciseDrv.html",
    "<div ng-transclude></div>\n" +
    "<template-by-platform class=\"znk-carousel-container\"\n" +
    "                      prefix=\"components/znkExercise/core/template\"\n" +
    "                      mobile-temp=\"questionSwiperMobileTemplate.html\"\n" +
    "                      desktop-temp=\"questionSwiperDesktopTemplate.html\">\n" +
    "</template-by-platform>\n" +
    "<znk-exercise-btn-section class=\"btn-section\"\n" +
    "                          prev-question=\"vm.setCurrentIndexByOffset(-1)\"\n" +
    "                          next-question=\"vm.setCurrentIndexByOffset(1)\"\n" +
    "                          active-slide=\"d.currentSlide\"\n" +
    "                          questions=\"d.questionsWithAnswers\">\n" +
    "\n" +
    "</znk-exercise-btn-section>\n" +
    "<znk-exercise-pager\n" +
    "        ng-hide=\"d.hidePager\"\n" +
    "        questions=\"d.questionsWithAnswers\"\n" +
    "        ng-model=\"d.currentSlide\">\n" +
    "</znk-exercise-pager>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/chevron-icon.svg",
    "<svg x=\"0px\" y=\"0px\" viewBox=\"0 0 143.5 65.5\">\n" +
    "    <polyline class=\"st0\" points=\"6,6 71.7,59.5 137.5,6 \"/>\n" +
    "</svg>\n" +
    "");
}]);
