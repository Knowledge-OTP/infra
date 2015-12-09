/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll').directive('znkScroll', [
        '$log', '$window',
        function ($log, $window) {
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
                domElement.style[prop] = value;
            }

            return {
                restrict: 'E',
                compile: function(element){
                    var domElement = element[0];
                    var bodyDomElement = document.querySelector('body');

                    domElement.addEventListener('mousedown',mouseDownHandler);

                    function mouseDownHandler(evt){
                        $log.debug('mouse down',evt.pageX);

                        var containerWidth = domElement.offsetWidth;

                        var child = domElement.children[0];
                        var childStyle = $window.getComputedStyle(child);
                        var childMarginRight = +childStyle.marginRight.replace('px','');
                        var childMarginLeft = +childStyle.marginLeft.replace('px','');
                        var childWidth = child.offsetWidth + childMarginLeft + childMarginRight;

                        var currMousePoint = {
                            x: evt.pageX,
                            y: evt.pageY
                        };

                        function mouseMoveEventHandler(evt){
                            $log.debug('mouse move',evt.pageX);
                            var xOffset = evt.pageX - currMousePoint.x;
                            //var yOffset = evt.pageY - currMousePoint.y;

                            currMousePoint.x = evt.pageX;
                            currMousePoint.y = evt.pageY;
                            moveScroll(containerWidth,childWidth,xOffset);
                        }
                        document.addEventListener('mousemove',mouseMoveEventHandler);

                        function mouseUpEventHandler(evt){
                            $log.debug('mouse up',evt.pageX);
                            document.removeEventListener('mousemove',mouseMoveEventHandler);
                            document.removeEventListener('mouseup',mouseUpEventHandler);
                        }
                        document.addEventListener('mouseup',mouseUpEventHandler);
                    }

                    function moveScroll(containerWidth,childWidth,xOffset/*,yOffset*/){
                        var children = domElement.children;
                        var child = children[0];

                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;

                        if(!child.style.transform){
                            setElementTranslateX(child,0,false,false,minTranslateX,maxTranslateX);
                        }

                        setElementTranslateX(child,xOffset,true,minTranslateX,maxTranslateX);
                    }

                    function preFn(scope,element,attrs){

                    }

                    function postFn(){

                    }

                    return {
                        pre: preFn,
                        post: postFn
                    };

                }
            };
        }
    ]);

})(angular);

