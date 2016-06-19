
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').directive('znkAudioPlayer', [
        '$timeout', '$window', '$interval', 'MediaSrv',
        function znkAudioPlayerDrv($timeout, $window, $interval) {
            return {
                templateUrl: 'components/znkAudioPlayer/templates/znkAudioPlayer.template.html',
                scope: {
                    sourceGetter: '&source',
                    typeGetter: '&?type',
                    autoPlayGetter: '&autoPlay',
                    onEnded: '&',
                    internalPath: '&'
                },
                link:function(scope,element,attrs){
                    var sound;

                    var TYPES_ENUM = {
                        'NO_CONTROL': 1,
                        'HAS_CONTROL': 2
                    };

                    var domElement = element[0];

                    var STATE_ENUM = {
                        NONE: $window.Media.MEDIA_NONE,
                        PAUSE: $window.Media.MEDIA_PAUSED,
                        RUNNING: $window.Media.MEDIA_RUNNING,
                        STOPPED: $window.Media.MEDIA_STOPPED,
                        STARTING: $window.Media.MEDIA_STARTING
                    };

                    var type = scope.typeGetter() || 1;

                    scope.d = {
                        type: type,
                        STATE_ENUM: STATE_ENUM,
                        playOrPause: function(){
                            if(!sound){
                                return;
                            }
                            if(scope.d.currState === STATE_ENUM.RUNNING){
                                sound.pause();
                            }else{
                                sound.play();
                            }
                        }
                    };

                    switch(type){
                        case TYPES_ENUM.NO_CONTROL:
                            element.addClass('type-no-control');
                            break;
                        case TYPES_ENUM.HAS_CONTROL:
                            element.addClass('type-has-control');
                            break;
                    }

                    if(attrs.actions){
                        scope.$parent.$eval(attrs.actions + '=' + attrs.actions + '|| {}');
                        var actions = scope.$parent.$eval(attrs.actions);
                        actions.play = function(){
                            sound.play();
                        };
                    }

                    function resumePlayingAudio(){
                        switch (scope.d.type){
                            case TYPES_ENUM.NO_CONTROL:
                                var audioProgressDomElement = domElement.querySelector('.audio-progress');
                                audioProgressDomElement.style['-webkit-transition'] = audioProgressDomElement.style.transition = '';
                                break;
                            case TYPES_ENUM.HAS_CONTROL:
                                break;
                        }
                        startUpdatingTimeAndProgress();
                    }

                    function startUpdatingTimeAndProgress(){
                        if(startUpdatingTimeAndProgress.intervalProm){
                            $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                        }
                        setTimeAndProgress();
                        startUpdatingTimeAndProgress.intervalProm = $interval(function(){
                            setTimeAndProgress();
                        },1000,0,false);
                    }

                    function setTimeAndProgress() {
                        var timePassedElement = domElement.querySelector('.time-passed');
                        var timeLeftElement = domElement.querySelector('.time-left');
                        var duration = sound.getDuration();
                        if(duration <= 0){
                            return;
                        }
                        sound.getCurrentPosition(function(currPos){
                            currPos = Math.max(currPos,0);
                            switch(scope.d.type){
                                case TYPES_ENUM.NO_CONTROL:
                                    var audioProgressDomElement = domElement.querySelector('.audio-progress');
                                    if(audioProgressDomElement.style.transition === ''){
                                        var initWidthInPercent = currPos / duration * 100;
                                        audioProgressDomElement.style.width = initWidthInPercent + '%';

                                        var timeLeft = duration - currPos;
                                        audioProgressDomElement.style['-webkit-transition'] = audioProgressDomElement.style.transition = 'width ' + timeLeft +'s linear';
                                        audioProgressDomElement.style.width = '100%';
                                    }
                                    timePassedElement.innerHTML = $filter('secondsToTime')(currPos,'m:ss');
                                    break;
                                case TYPES_ENUM.HAS_CONTROL:
                                    var inputRangeDomElem = domElement.querySelector('input[type="range"]');
                                    inputRangeDomElem.value = currPos;
                                    inputRangeDomElem.max = Math.round(duration);
                                    if(inputRangeDomElem.value < inputRangeDomElem.max){
                                        inputRangeDomElem.stepUp(1);
                                    }
                                    break;
                            }

                            timeLeftElement.innerHTML = $filter('secondsToTime')(duration - currPos,'-' + 'm:ss');
                            if(ENV.debug && duration && currPos && (duration - currPos) > 20){
                                sound.seekTo(1000 * (duration - 5));
                            }
                        },angular.noop);
                    }

                    function audioPositionChangedHandler(){
                        /* jshint validthis: true */
                        sound.seekTo(+this.value * 1000);
                    }

                    var statusChanged = function statusChanged(status, allowReplay){
                        scope.d.currState = status;
                        var playerControlElem = angular.element(domElement.querySelector('.player-control'));
                        console.log('audio status changed, status: ' + status + ' src:' + scope.sourceGetter());
                        switch(status){
                            case STATE_ENUM.STOPPED:
                                //$apply causing exceptions ...
                                $timeout(function(){
                                    scope.onEnded({allowReplay : allowReplay});
                                });
                                $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-pause');
                                    playerControlElem.addClass('ion-play');
                                }
                                break;
                            case STATE_ENUM.NONE:
                            case STATE_ENUM.PAUSE:
                                $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-pause');
                                    playerControlElem.addClass('ion-play');
                                }
                                break;
                            case STATE_ENUM.RUNNING:
                                resumePlayingAudio();
                                hideLoadingSpinner();
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-play');
                                    playerControlElem.addClass('ion-pause');
                                }
                                break;
                            case STATE_ENUM.STARTING:
                                hideLoadingSpinner();
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-play');
                                    playerControlElem.addClass('ion-pause');
                                }
                                break;
                        }
                    };

                    function loadSound(){
                        if(sound){
                            sound.stop();
                            sound.release();
                        }
                        showLoadingSpinner();
                        sound = MediaSrv.loadSound(scope.sourceGetter(),
                            function success(){}
                            //function err(){
                            //    $timeout(function(){
                            //        var errMsg = NetworkSrv.isDeviceOffline() ? ErrorHandlerSrv.messages.noInternetConnection : ErrorHandlerSrv.messages.defaultErrorMessage;
                            //        ErrorHandlerSrv.displayErrorMsg(errMsg).then(function() {
                            //            statusChanged(STATE_ENUM.STOPPED, true);
                            //        });
                            //    });
                            //},
                            //statusChanged,
                            //HACK currently the recorded audio is not save in dataDirectory
                            //!!scope.internalPath()
                        );
                    }

                    function hideShowLoadingSpinner(displayedElemSelector,hiddenElemSelector){
                        var displayedDomElement = domElement.querySelector(displayedElemSelector);
                        if(displayedDomElement){
                            displayedDomElement.style.display = 'block';
                        }

                        var hiddenDomElement = domElement.querySelector(hiddenElemSelector);
                        if(hiddenDomElement){
                            hiddenDomElement.style.display = 'none';
                        }
                    }
                    var showLoadingSpinner = hideShowLoadingSpinner.bind(this,'ion-spinner','.time-left');

                    var hideLoadingSpinner = hideShowLoadingSpinner.bind(this,'.time-left','ion-spinner');

                    $timeout(function(){
                        if(type === TYPES_ENUM.HAS_CONTROL) {
                            var inputRangeDomElem = domElement.querySelector('input[type="range"]');
                            inputRangeDomElem.addEventListener('change', audioPositionChangedHandler);
                        }
                    });

                    scope.$watch('sourceGetter()',function(newSrc){
                        if(newSrc){
                            loadSound();

                            if(scope.autoPlayGetter()){
                                sound.play();
                            }
                        }
                    });

                    scope.$on('$destroy',function(){
                        if(sound){
                            sound.release();
                        }
                        $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                        if(type === TYPES_ENUM.HAS_CONTROL){
                            var inputRangeDomElem = domElement.querySelector('input[type="range"]');
                            inputRangeDomElem.removeEventListener('change',audioPositionChangedHandler);
                        }
                    });
                }
            };
        }]);
})(angular);
