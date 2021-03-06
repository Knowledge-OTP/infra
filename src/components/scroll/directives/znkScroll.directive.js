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
            var child;
            function setElementTranslateX(element,val,isOffset,minVal,maxVal){
                var domElement = angular.isArray(element) ? element[0] : element;
                var newTranslateX = val;
                if(isOffset){
                    var currTransformVal = domElement.style.transform;
                    var currXMatchRegex = currTransformVal.match(/translateX\((.*)px\)/);
                    var currX;
                    if(!angular.isArray(currXMatchRegex ) || currXMatchRegex.length < 2){
                        //$log.debug('failed to math transform value');
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
                    var currMousePoint;
                    var containerWidth;
                    var childWidth;
                    var WHEEL_MOUSE_EVENT = 'wheel';
                    function mouseMoveEventHandler(evt){
                        //$log.debug('mouse move',evt.pageX);
                        var xOffset = evt.pageX - currMousePoint.x;
                        currMousePoint.x = evt.pageX;
                        currMousePoint.y = evt.pageY;
                        moveScroll(xOffset,containerWidth,childWidth);
                        //stop event bubbling
                        evt.preventDefault();
                        evt.stopPropagation();
                        return false;
                    }
                    function mouseUpEventHandler(){
                        //$log.debug('mouse up',evt.pageX);
                        document.removeEventListener('mousemove',mouseMoveEventHandler);
                        document.removeEventListener('mouseup',mouseUpEventHandler);
                        containerWidth = null;
                        childWidth = null;
                        currMousePoint = null;
                    }
                    function mouseDownHandler(evt){
                        //$log.debug('mouse down',evt.pageX);
                        if(!child){
                            return;
                        }
                        containerWidth = domElement.offsetWidth;
                        childWidth = getElementWidth(child);
                        currMousePoint = {
                            x: evt.pageX,
                            y: evt.pageY
                        };
                        document.addEventListener('mousemove',mouseMoveEventHandler);
                        document.addEventListener('mouseup',mouseUpEventHandler);
                    }
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
                        post: function(scope,element,attrs){
                            element[0].addEventListener('mousedown',mouseDownHandler);
                            child = element[0].children[0];
                            if(child){
                                setElementTranslateX(child,0);
                            }
                            var scrollOnMouseWheel = $interpolate(attrs.scrollOnMouseWheel || '')(scope) !== 'false';
                            var containerWidth,childWidth;
                            function mouseWheelEventHandler(evt){
                                //$log.debug('mouse wheel event',evt);
                                var offset = -evt.deltaY * 4;// firefox is really slow....
                                moveScroll(offset, containerWidth, childWidth);
                            }
                            function mouseEnterEventHandler(){
                                //$log.debug('mouse enter');
                                containerWidth = domElement.offsetWidth;
                                childWidth = getElementWidth(domElement.children[0]);
                                domElement.addEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            }
                            function mouseUpEventHandler(){
                                //$log.debug('mouse leave');
                                domElement.removeEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
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
                                domElement.removeEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            });
                        }
                    };
                }
            };
        }
    ]);
})(angular);
