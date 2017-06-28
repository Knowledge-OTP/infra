'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('markup', [
        '$window',
        function ($window) {
            var MAX_IMAGE_WIDTH = 275;
            var dummyElem = angular.element('<P/>');
            return {
                replace: true,
                restrict: 'EA',
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

                    function getActualStyle(val){
                        var actualVal = 0;
                        try{
                            if(angular.isDefined(val) && val !== null) {
                                actualVal = parseInt(val.replace('px', ''));
                            }
                        } catch (err) {
                            actualVal = 0;
                        }
                       return actualVal;
                    }

                    function calcParentWidth() {
                        var parent = element[0].parentElement;
                        var isBody = false;
                        var parentWidth;

                        try{
                            while (!parent.classList.contains('question-container') 
                                  && !parent.classList.contains('answer-container')) {
                                if(parent.nodeName && parent.nodeName.toLowerCase() === 'body') {
                                    isBody = true;
                                    break;
                                }
                                parent = parent.parentElement;
                            }

                            if (!isBody) {
                              parentWidth = parent.offsetWidth;
                              var paddingLeft = getActualStyle(window.getComputedStyle(parent).paddingLeft);
                              var paddingRight =getActualStyle(window.getComputedStyle(parent).paddingRight);

                              parentWidth = (parentWidth -  paddingLeft - paddingRight);
                            }
                        } catch(e) {
                            parentWidth = undefined;
                        }

                        if(isNaN(parentWidth) || isBody) {
                            if(angular.isDefined(attrs.halfView)) {
                                MAX_IMAGE_WIDTH = ($window.innerWidth / 3.2);
                            } else {
                                MAX_IMAGE_WIDTH = ($window.innerWidth / 1.48);
                            }
                        }

                        return parentWidth;
                    }

                    var watchDestroyer = scope.$watch(attrs.content,function(newVal){
                        if(!!newVal){
                            MAX_IMAGE_WIDTH = calcParentWidth();

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

