(function (angular) {
    'use strict';

    angular.module('znk.infra', [
        'znk.infra.pngSequence',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'znk.infra.general',
        'znk.infra.scroll'
    ]);
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
                    }
                    function mouseDownHandler(evt){
                        $log.debug('mouse down',evt.pageX);

                        var containerWidth = domElement.offsetWidth;
                        var childWidth = getElementWidth(domElement.children[0]);

                        var currMousePoint = {
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
                    pre: function (scope, element, attrs) {
                        element.css('display','block');

                        var name = scope.name;
                        if (!name) {
                            $log.error('svgIcon directive: name attribute was not set');
                            return;
                        }

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

            var svgMap;
            this.registerSvgSources = function (_svgMap) {
                svgMap = _svgMap;
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
