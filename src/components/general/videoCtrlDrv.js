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
