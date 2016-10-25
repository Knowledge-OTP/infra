(function (angular) {
    'use strict';

    angular.module('znk.infra.general',
        [
            'znk.infra.enum',
            'znk.infra.svgIcon',
            'pascalprecht.translate',
            'angular-svg-round-progressbar'
        ])
        .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'general-clock-icon': 'components/general/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);

})(angular);

/**
 * evaluates content , then it appended it to the DOM , and finally it compiles it with scope which was created out of the directive scope.
 * attrs-
 *  compile-drv: expression which be evaluated and then appended to the dom.
 *  bind-once: angular expression which evaluated by the scope , if it true then the watcher will be killed after the first time content was added to the dom
 */

'use strict';

(function (angular) {
    angular.module('znk.infra.general').directive('compile', [
        '$compile','$animate',
        function($compile,$animate) {
            return {
            link: function(scope,element,attrs){
                var _childScope;

                var watchDestroyer = scope.$watch(attrs.compile,function(newVal){
                    if(_childScope){
                        _childScope.$destroy();
                        _childScope = null;
                        $animate.leave(element.children());
                        element.empty();
                    }


                    if(typeof newVal === 'undefined'){
                        return;
                    }

                    if(scope.$eval(attrs.bindOnce)){
                        watchDestroyer();
                    }

                    if(typeof newVal !== 'string'){
                        if(newVal === null){
                            newVal = '';
                        }
                        newVal = '' + newVal;
                    }

                    var _htmlStrRegex = /^<(.*)>.*<\/\1>$/;
                    /**
                     * check if html string , if true create jq lite element of it and append with animation otherwise just append to the dom
                     */
                    if(_htmlStrRegex.test(newVal)){
                        _childScope = scope.$new();
                        var $content = angular.element(newVal);
                        $animate.enter($content,element);
                        $compile(element.children())(_childScope);
                    }else{
                        element.append(newVal);
                    }
                });
            }
        };
    }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.general')
        .config(
            ["$translateProvider", function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "TIMER": {
                        "SECONDS": "seconds",
                        "SEC":"sec"
                    }
                });
            }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.general').filter('cutString', function cutStringFilter() {
        return function (str, length, onlyFullWords) {
            length = +length;
            if (!str || length <= 0) {
                return '';
            }
            if (isNaN(length) || str.length < length) {
                return str;
            }
            var words = str.split(' ');
            var newStr = '';
            if (onlyFullWords) {
                for (var i = 0; i < words.length; i++) {
                    if (newStr.length + words[i].length <= length) {
                        newStr = newStr + words[i] + ' ';
                    } else {
                        break;
                    }
                }
            } else {
                newStr = str.substr(0, length);
            }

            return newStr + '...';
        };
    });
})(angular);


'use strict';

(function (angular) {
    angular.module('znk.infra.general').directive('disableClickDrv', [
        function () {
            return {
                priority: 200,
                link: {
                    pre: function (scope, element, attrs) {
                        function clickHandler(evt){
                            if(attrs.disabled){
                                evt.stopImmediatePropagation();
                                evt.preventDefault();
                                return false;
                            }
                        }
                        var eventName = 'click';
                        element[0].addEventListener (eventName, clickHandler);
                        scope.$on('$destroy',function(){
                            element[0].removeEventListener (eventName, clickHandler);
                        });
                    }
                }
            };
        }
    ]);
})(angular);

/**
 * attrs -
 *
 *  bg
 *  bgLoader
 *  fontColor
 *  precentage
 *  showLoader
 *  fillLoader
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('elementLoader', function () {
        var directive = {
            restrict: 'EA',
            scope: {
                bg: '=',
                bgLoader: '=',
                fontColor: '=',
                precentage: '=',
                showLoader: '=',
                fillLoader: '='
            },
            link: function (scope, elem) {
                var defaultView = function () {
                    elem[0].className = elem[0].className + ' elem-loader';
                    elem[0].style.backgroundImage = 'linear-gradient(to right, ' + scope.bg + ' 10%,rgba(255, 255, 255, 0) 0,' + scope.bg + ' 0)';
                    elem[0].style.backgroundSize = '100%';
                    elem[0].style.webkitTransition = 'background-size 20000ms cubic-bezier(0.000, 0.915, 0.000, 0.970)';
                };

                scope.$watch('showLoader', function (newValue) {
                    if (newValue) {
                        elem[0].style.color = scope.fontColor;
                        elem[0].style.backgroundImage = 'linear-gradient(to right, ' + scope.bgLoader + ' 10%,rgba(255, 255, 255, 0) 0,' + scope.bg + ' 0)';
                        elem[0].style.backgroundSize = '900%';
                    }
                }, true);

                scope.$watch('fillLoader', function (newValue) {
                    if (!!newValue) {
                        elem[0].style.webkitTransition = 'background-size 100ms ';
                        elem[0].style.backgroundSize = '1100%';
                    } else {
                        if (typeof newValue === 'undefined') {
                            return;
                        }
                        defaultView();
                    }
                }, true);

                defaultView();
            }
        };

        return directive;
    });

})(angular);

/**
 *  @directive subjectIdToAttrDrv
 *  This directive is an evolution of 'subjectIdToClassDrv'
 *  @context-attr a comma separated string of attribute names
 *  @prefix a comma separated string of prefixes to the attribute values
 *  @suffix a comma separated string of suffixes to the attribute values
 *
 *  In case only one prefix/suffix is provided, it will be used in all attributes
 *  In case no @context-attr is provided, it will set the class attribute by default
 *  No need to pass dashes ('-') to prefix or suffix, they are already appended
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToAttrDrv', [
        'SubjectEnum', '$interpolate',
        function (SubjectEnum, $interpolate) {
            return {
                link: {
                    pre: function (scope, element, attrs) {
                        var addedClassesArr = [];

                        scope.$watch(attrs.subjectIdToAttrDrv, function (subjectId) {
                            var contextAttr = attrs.contextAttr ? $interpolate(attrs.contextAttr)(scope) : undefined;
                            var prefix = attrs.prefix ? $interpolate(attrs.prefix)(scope) : undefined;
                            var suffix = attrs.suffix ? $interpolate(attrs.suffix)(scope) : undefined;

                            if (angular.isUndefined(subjectId)) {
                                return;
                            }

                            var attrsArray;
                            if (contextAttr) {
                                attrsArray = contextAttr.split(',');
                            } else {
                                attrsArray = [];
                                attrsArray.push('class');
                            }

                            var attrPrefixes = (prefix) ? prefix.split(',') : [];
                            var attrSuffixes = (suffix) ? suffix.split(',') : [];

                            var subjectEnumMap = SubjectEnum.getEnumMap();
                            var subjectNameToAdd = subjectEnumMap[subjectId];

                            angular.forEach(attrsArray, function (value, key) {
                                var attrVal = subjectNameToAdd;

                                if (attrPrefixes.length) {
                                    var prefix = attrPrefixes[key] || attrPrefixes[0];
                                    if(prefix !== ''){
                                        attrVal = prefix + '-' + attrVal;
                                    }
                                }

                                if (attrSuffixes.length) {
                                    var suffix = attrSuffixes[key] || attrSuffixes[0];
                                    if(suffix !== ''){
                                        attrVal += '-' + suffix;
                                    }
                                }

                                attrVal = attrVal.replace(/\s+/g, '');   // regex to clear spaces
                                value = value.replace(/\s+/g, '');   // regex to clear spaces

                                if (value === 'class') {
                                    if (!element.hasClass(attrVal)) {
                                        addedClassesArr.forEach(function (clsToRemove) {
                                            if(clsToRemove.indexOf(subjectNameToAdd) === -1){
                                                element.removeClass(clsToRemove);
                                            }
                                        });
                                        addedClassesArr.push(attrVal);
                                        element.addClass(attrVal);
                                    }
                                    } else {
                                        element.attr(value, attrVal);
                                    }
                                }
                                );

                        });
                    }
                }
            };
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
 * attrs -
 *      ng-model
 *      play
 *      type:
 *          1: timer with displayed time.
 *          2: timer with round progress bar
 *      config:
 *          stopOnZero
 *          countDown
 *          format: defaulted to mm:ss
 *          only for type 2:
 *              stroke
 *              bgcolor
 *              color
 *              radius
 *              max
 *              clockwise
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('timer', [
        '$interval', '$translatePartialLoader', '$timeout',
        function ($interval, $timeout) {
            var timerTypes = {
                'REGULAR': 1,
                'ROUND_PROGRESSBAR': 2
            };

            return {
                scope: {
                    play: '=?',
                    typeGetter: '&?type',
                    configGetter: '&?config'
                },
                require: '?ngModel',
                replace: true,
                templateUrl: 'components/general/templates/timerDrv.html',
                link: function link(scope, element, attrs, ngModelCtrl) {
                    var domElement = element[0];

                    scope.ngModelCtrl = ngModelCtrl;

                    function padNum(num) {
                        if (('' + Math.abs(+num)).length < 2) {
                            return (num < 0 ? '-' : '') + '0' + Math.abs(+num);
                        } else {
                            return num;
                        }
                    }

                    function getDisplayedTime(currentTime, format) {
                        var totalSeconds = currentTime / 1000;
                        var seconds = Math.floor(totalSeconds % 60);
                        var minutes = Math.floor(Math.abs(totalSeconds) / 60) * (totalSeconds < 0 ? -1 : 1);
                        var paddedSeconds = padNum(seconds);
                        var paddedMinutes = padNum(minutes);

                        return format
                            .replace('tss', totalSeconds)
                            .replace('ss', paddedSeconds)
                            .replace('mm', paddedMinutes);

                    }

                    function updateTime(currentTime) {
                        if (scope.config.countDown && scope.config && scope.config.max) {
                            scope.timeElapsed = scope.config.max - currentTime;
                        } else {
                            scope.timeElapsed = currentTime;
                        }

                        var displayedTime = getDisplayedTime(currentTime, scope.config.format);
                        var timeDisplayDomElem;
                        switch (scope.type) {
                            case 1:
                                timeDisplayDomElem = domElement.querySelector('.timer-view');
                                break;
                            case 2:
                                timeDisplayDomElem = domElement.querySelector('.timer-display');
                                break;
                        }

                        if (timeDisplayDomElem) {
                            timeDisplayDomElem.innerText = displayedTime;
                        }
                    }

                    var intervalHandler;
                    var INTERVAL_TIME = 1000;

                    scope.type = scope.typeGetter() || 1;

                    var configDefaults = {
                        format: 'mm:ss',
                        stopOnZero: true,
                        stroke: 2
                    };
                    var config = (scope.configGetter && scope.configGetter()) || {};
                    scope.config = angular.extend(configDefaults, config);

                    switch (scope.type) {
                        case timerTypes.ROUND_PROGRESSBAR:
                        {
                            var roundProgressBarConfigDefults = {
                                stroke: 3,
                                bgcolor: '#0a9bad',
                                color: '#e1e1e1'
                            };
                            scope.config = angular.extend(roundProgressBarConfigDefults, scope.config);
                            scope.config.radius = scope.config.radius || Math.floor(element[0].offsetHeight / 2) || 45;
                            break;
                        }
                    }

                    function tick() {
                        var currentTime = ngModelCtrl.$viewValue;

                        if (angular.isUndefined(currentTime)) {
                            return;
                        }

                        currentTime += scope.config.countDown ? -INTERVAL_TIME : INTERVAL_TIME;

                        if (scope.config.stopOnZero && currentTime <= 0) {
                            scope.play = false;
                            currentTime = 0;
                        }

                        updateTime(currentTime);
                        ngModelCtrl.$setViewValue(currentTime);
                    }

                    ngModelCtrl.$render = function () {
                        var currentTime = ngModelCtrl.$viewValue;
                        if (angular.isUndefined(currentTime)) {
                            return;
                        }
                        $timeout(function(){
                            updateTime(currentTime);
                        });
                    };

                    scope.$watch('play', function (play) {
                        if (intervalHandler) {
                            $interval.cancel(intervalHandler);
                        }

                        if (play) {
                            intervalHandler = $interval(tick, INTERVAL_TIME, 0, false);
                        }
                    });

                    scope.$on('$destroy', function () {
                        $interval.cancel(intervalHandler);
                    });
                }
            };
        }]);

})(angular);

/**
 *
 *
 */
'use strict';
(function (angular) {
    angular.module('znk.infra.general').directive('videoCtrlDrv', [
        '$interpolate', '$timeout',
        function ($interpolate, $timeout) {
            var videoHeightType = {
                FIT: 'fit',
                COVER: 'cover'
            };
            return {
                transclude: 'element',
                priority: 1000,
                scope:{
                    onEnded: '&?',
                    onCanplay: '&?',
                    onPlay: '&?',
                    onVideoError: '&?',
                    videoErrorPoster: '@?',
                    actions: '=?',
                    heightToWidthRatioGetter: '&heightToWidthRatio',
                    videoHeight: '@'
                },
                link: function(scope, element, attrs, ctrl, transclude) {
                    var posterMaskElement;
                    var parentElem = element.parent();
                    var parentDomElem = parentElem[0];

                    if (attrs.customPoster) {
                        posterMaskElement = angular.element('<img src="' + attrs.customPoster + '" ' +
                            'style="position:absolute;top:0;right:0;bottom:0;left:0;">');
                        var parentStyle = window.getComputedStyle(parentDomElem);
                        if (parentStyle.position === 'static') {
                            parentDomElem.style.position = 'relative';
                        }
                        parentElem.append(posterMaskElement);
                    }

                    var posterImg;
                    if(attrs.znkPosterDrv){
                        posterImg = new Image();
                        posterImg.src = $interpolate(attrs.znkPosterDrv)(scope.$parent);
                    }

                    var elementsToRemoveErrorEventListeners = [];
                    function _addVideoSourceErrorHandler(videoDomElem){
                        var sourcesDomElement = videoDomElem.querySelectorAll('source');

                        var relevantSourceDomElement;

                        if(sourcesDomElement.length){
                            relevantSourceDomElement = sourcesDomElement[sourcesDomElement.length -1];
                        }else{
                            relevantSourceDomElement = videoDomElem;
                        }

                        function errorHandler(ev) {
                            $timeout(function(){
                                if(scope.onVideoError){
                                    scope.onVideoError(ev);
                                }

                                if(scope.videoErrorPoster){
                                    videoDomElem.removeAttribute("controls");
                                    videoDomElem.poster = scope.videoErrorPoster;
                                    videoDomElem.style.display = '';
                                }
                            });
                        }
                        relevantSourceDomElement.addEventListener('error', errorHandler);

                        elementsToRemoveErrorEventListeners.push({
                            domElement: relevantSourceDomElement,
                            handler: errorHandler
                        });
                    }

                    transclude(scope.$parent, function (clone) {

                        var videoElem = clone;
                        var videoDomElem = videoElem[0];

                        _addVideoSourceErrorHandler(videoDomElem);

                        videoDomElem.style.display = 'none';//preventing element resize flickering
                        parentElem.append(videoElem);

                        scope.actions = scope.actions || {};

                        scope.actions.replay = function () {
                            scope.actions.stop();
                            videoDomElem.play();
                        };

                        scope.actions.play = function(){
                            videoDomElem.play();
                        };

                        scope.actions.stop = function(){
                            videoDomElem.pause();
                            videoDomElem.currentTime = '0';
                        };

                        function endedHandler() {
                            scope.$apply(function () {
                                scope.onEnded();
                            });
                        }

                        function fitVideo(ratio){
                            var containerWidth, containerHeight;
                            var heightToWidthRatio = scope.heightToWidthRatioGetter() || ratio;
                            heightToWidthRatio = +heightToWidthRatio;
                            var heightSizeByWidth = parentDomElem.offsetWidth * heightToWidthRatio;
                            if (heightSizeByWidth <= parentDomElem.offsetHeight) {
                                containerWidth = parentDomElem.offsetWidth;
                                containerHeight = heightSizeByWidth;
                            } else {
                                containerHeight = parentDomElem.offsetHeight;
                                containerWidth = containerHeight / heightToWidthRatio;
                            }

                            containerWidth = Math.round(containerWidth);
                            containerHeight = Math.round(containerHeight);

                            videoDomElem.style.width = containerWidth + 'px';
                            //black line bug fix for iphone 4
                            videoDomElem.style.height = containerHeight + ((containerHeight % 2) ? 0 : 1) + 'px';
                        }

                        function coverVideo(ratio){
                            videoDomElem.style.position = 'relative';
                            var heightByWidth = parentDomElem.offsetWidth * ratio;
                            if(heightByWidth >= parentDomElem.offsetHeight){
                                videoDomElem.style.width =  parentDomElem.offsetWidth + 'px';
                                videoDomElem.style.height = heightByWidth + 'px';
                                videoDomElem.style.top = -((heightByWidth - parentDomElem.offsetHeight) / 2) + 'px';
                            }
                            else{
                                var widthByParentHeight = parentDomElem.offsetHeight * (1/ratio);
                                videoDomElem.style.width =  widthByParentHeight + 'px';
                                videoDomElem.style.height = parentDomElem.offsetHeight + 'px';
                                videoDomElem.style.left = -((widthByParentHeight - parentDomElem.offsetWidth) / 2) + 'px';
                            }
                        }

                        function canPlayHandler() {
                            if (posterMaskElement) {
                                posterMaskElement.remove();
                            }
                            scope.$apply(function () {
                                if(scope.onCanplay){
                                    scope.onCanplay();
                                }
                            });
                        }

                        function playHandler() {
                            $timeout(function() {
                                if(scope.onPlay) {
                                    scope.onPlay();
                                }
                            });
                        }

                        function setVideoDimensions(width,height){
                            if(setVideoDimensions.wasSet){
                                return;
                            }
                            setVideoDimensions.wasSet = true;

                            var videoHeight = height;
                            var videoWidth = width;
                            var ratio = videoHeight / videoWidth;

                            switch (scope.videoHeight) {
                                case videoHeightType.FIT:
                                    fitVideo(ratio);
                                    break;
                                case videoHeightType.COVER:
                                    coverVideo(ratio);
                                    break;
                            }

                            videoDomElem.style.display = '';

                        }

                        function loadedmetadata(){
                            /* jshint validthis: true */
                            setVideoDimensions(this.videoHeight,this.videoWidth);
                        }

                        videoElem.on('canplay', canPlayHandler);
                        videoElem.on('play', playHandler);
                        videoElem.on('ended', endedHandler);

                        if(posterImg){
                            posterImg.onload = function(){
                                setVideoDimensions(posterImg.width/2,posterImg.height/2);//All posters must be in twice size for retina
                            };
                        }

                        videoDomElem.addEventListener('loadedmetadata',loadedmetadata, false );

                        scope.$on('$destroy', function () {
                            videoElem.off('canplay', canPlayHandler);

                            videoElem.off('play', playHandler);

                            videoElem.off('ended', endedHandler);

                            videoDomElem.removeEventListener('loadedmetadata',loadedmetadata );

                            elementsToRemoveErrorEventListeners.forEach(function(removedElementData){
                                removedElementData.domElement.removeEventListener('error', removedElementData.handler);
                            });

                            if(posterImg){
                                posterImg.onload = null;
                            }

                            scope.loadStart = false;
                        });
                    });
                }
            };
        }
    ]);
})(angular);

angular.module('znk.infra.general').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/general/svg/clock-icon.svg",
    "<svg version=\"1.1\" class=\"clock-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     viewBox=\"0 0 183 208.5\">\n" +
    "    <style>\n" +
    "        .clock-icon-svg{\n" +
    "            width: 15px;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg g *{\n" +
    "            stroke: #757A83;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st0 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 10.5417;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st1 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 12.3467;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st2 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 11.8313;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st3 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 22.9416;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st4 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 14;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st5 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 18;\n" +
    "            stroke-linejoin: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "\n" +
    "    </style>\n" +
    "    <g>\n" +
    "        <circle class=\"st0\" cx=\"91.5\" cy=\"117\" r=\"86.2\"/>\n" +
    "        <line class=\"st1\" x1=\"92.1\" y1=\"121.5\" x2=\"92.1\" y2=\"61\"/>\n" +
    "        <line class=\"st2\" x1=\"92.1\" y1=\"121.5\" x2=\"131.4\" y2=\"121.5\"/>\n" +
    "        <line class=\"st3\" x1=\"78.2\" y1=\"18.2\" x2=\"104.9\" y2=\"18.2\"/>\n" +
    "        <line class=\"st4\" x1=\"61.4\" y1=\"7\" x2=\"121.7\" y2=\"7\"/>\n" +
    "        <line class=\"st5\" x1=\"156.1\" y1=\"43\" x2=\"171.3\" y2=\"61\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/general/templates/timerDrv.html",
    "<div ng-switch=\"type\" class=\"timer-drv\">\n" +
    "    <div ng-switch-when=\"1\" class=\"timer-type1\">\n" +
    "        <svg-icon class=\"icon-wrapper\" name=\"general-clock-icon\"></svg-icon>\n" +
    "        <div class=\"timer-view\"></div>\n" +
    "        <span class=\"timer-seconds-text\" translate=\"TIMER.SEC\"></span>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"2\" class=\"timer-type2\">\n" +
    "        <div class=\"timer-display-wrapper\">\n" +
    "            <div class=\"timer-display\"></div>\n" +
    "            <div class=\"seconds-text\" translate=\"TIMER.SECONDS\" ng-if=\"!config.hideSecondsText\"></div>\n" +
    "        </div>\n" +
    "        <div round-progress\n" +
    "             current=\"timeElapsed\"\n" +
    "             max=\"config.max\"\n" +
    "             color=\"{{config.color}}\"\n" +
    "             bgcolor=\"{{config.bgcolor}}\"\n" +
    "             stroke=\"{{config.stroke}}\"\n" +
    "             radius=\"{{config.radius}}\"\n" +
    "             clockwise=\"config.clockwise\">\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
