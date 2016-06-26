(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer', [
        'znk.infra.svgIcon'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    play: 'components/znkAudioPlayer/svg/play-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').directive('znkAudioPlayButton', [
        function znkAudioPlayerDrv() {
            return {
                templateUrl: 'components/znkAudioPlayer/templates/znkAudioPlayButton.template.html',
                scope: {
                    sourceGetter: '&source',
                    typeGetter: '&?type',
                    autoPlayGetter: '&autoPlay',
                    onEnded: '&',
                    switchInitGetter: '&switchInit',
                    allowReplay: '&?'
                },
                link:function(scope){
                    scope.d = {};

                    scope.d.statesEnum = {
                        START_PLAY: 1,
                        PLAYING: 2,
                        ALREADY_PLAYED: 3
                    };

                    var STATE_ENUM = {
                        START_PLAY: 1,
                        PLAYING: 2,
                        ALREADY_PLAYED: 3
                    };

                    scope.d.source = angular.isDefined(scope.sourceGetter) ? scope.sourceGetter() : undefined;
                    scope.d.type = angular.isDefined(scope.typeGetter) ? scope.typeGetter() : scope.d.statesEnum.START_PLAY;

                    var allowReplay =  angular.isDefined(scope.allowReplay) ? scope.allowReplay() : false;
                    var autoPlay = angular.isDefined(scope.autoPlayGetter) ? scope.autoPlayGetter() : false;
                    scope.audioPlayer = {
                        STATE_ENUM: STATE_ENUM,
                        audioEnded: function (){
                            if(angular.isDefined(scope.onEnded)) {
                                scope.onEnded();
                            }
                            scope.audioPlayer.currState = allowReplay ? STATE_ENUM.START_PLAY : STATE_ENUM.ALREADY_PLAYED;
                        }
                    };

                    if(scope.showAsDone && !allowReplay){
                        scope.audioPlayer.currState = STATE_ENUM.ALREADY_PLAYED;
                    }else{
                        scope.audioPlayer.currState = autoPlay ? STATE_ENUM.PLAYING : STATE_ENUM.START_PLAY;
                    }

                    scope.$watch('audioPlayer.currState', function (state) {
                        scope.isPlaying = state === STATE_ENUM.PLAYING;
                    });
                }
            };
        }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').directive('znkAudioPlayer', [
        '$timeout', '$window', '$interval', 'MediaSrv', '$filter', 'ENV',
        function znkAudioPlayerDrv($timeout, $window, $interval, MediaSrv, $filter, ENV) {
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

                    var type =  angular.isDefined(scope.typeGetter) ? scope.typeGetter() : 1;

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

                            timeLeftElement.innerHTML = $filter('secondsToTime')(duration - currPos,'- ' + 'm:ss');
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
                            function success(){},
                            function err(){
                            //    $timeout(function(){
                            //        var errMsg = NetworkSrv.isDeviceOffline() ? ErrorHandlerSrv.messages.noInternetConnection : ErrorHandlerSrv.messages.defaultErrorMessage;
                            //        ErrorHandlerSrv.displayErrorMsg(errMsg).then(function() {
                            //            statusChanged(STATE_ENUM.STOPPED, true);
                            //        });
                            //    });
                            },
                            statusChanged
                            //HACK currently the recorded audio is not save in dataDirectory
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

'use strict';

(function (angular) {

    angular.module('znk.infra.znkAudioPlayer').directive('znkImageAudio', ['$translatePartialLoader',
        function znkImageAudio($translatePartialLoader) {

            return {
                templateUrl: 'components/znkAudioPlayer/templates/znkImageAudio.template.html',
                scope: {
                    imageGetter: '&image',
                    source: '=audio',
                    hideFooter: '=',
                    onEnded: '&',
                    isPlaying: '=?',
                    showAsDone: '=?',
                    allowReplay: '&?',
                    autoPlayGetter: '&autoPlay',
                    blurredImageGetter: '&?blurredImage'
                },
                link: function (scope) {
                    $translatePartialLoader.addPart('znkAudioPlayer');

                    scope.d = {
                        image: scope.imageGetter(),
                        blurredImage: angular.isDefined(scope.blurredImageGetter) ? scope.blurredImageGetter : undefined
                    };
                }
            };
        }]);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').factory('MediaSrv', [
        'ENV', '$q', '$window',
        function (ENV, $q, $window) {

            var isRunningOnDevice = !!$window.cordova;

            var sound = window.Audio && new Audio();
            function Html5Media(src, mediaSuccess, mediaError, mediaStatus) {
                if (typeof $window.Audio !== 'function' && typeof $window.Audio !== 'object') {
                    console.warn('HTML5 Audio is not supported in this browser');
                }
                sound.src = src;

                sound.addEventListener('error', mediaError, false);

                function endedHandler(){
                    if (mediaStatus) {
                        mediaStatus($window.Media.MEDIA_STOPPED);
                    }
                    if (mediaSuccess) {
                        mediaSuccess();
                    }
                }
                sound.addEventListener('ended', endedHandler, false);

                function canplayHandler(){
                    console.log('Html5 audio load end ' + src);
                    if (mediaStatus) {
                        mediaStatus($window.Media.MEDIA_STARTING);
                    }
                }
                sound.addEventListener('canplay',canplayHandler, false);

                function canplaythroughHandler(){
                    console.log('Html5 audio load fully ended ' + src);
                    if (!playingHandler.wasInvoked) {
                        mediaStatus($window.Media.MEDIA_STARTING);
                    }
                }
                sound.addEventListener('canplaythrough',canplaythroughHandler, false);

                function playingHandler(){
                    playingHandler.wasInvoked = true;
                    if (mediaStatus) {
                        mediaStatus($window.Media.MEDIA_RUNNING);
                    }
                }
                sound.addEventListener('playing',playingHandler,false);

                console.log('starting Html5 audio load ' + src);
                sound.load();

                return {
                    // Returns the current position within an audio file (in seconds).
                    getCurrentPosition: function (successFn) {
                        successFn(sound.currentTime);
                    },
                    // Returns the duration of an audio file (in seconds) or -1.
                    getDuration: function () {
                        return isNaN(sound.duration) ? -1 : sound.duration;
                    },
                    // Start or resume playing an audio file.
                    play: function () {
                        sound.play();
                    },
                    // Pause playback of an audio file.
                    pause: function () {
                        sound.pause();
                        if (mediaStatus) {
                            mediaStatus($window.Media.MEDIA_PAUSED);
                        }
                    },
                    // Releases the underlying operating system's audio resources. Should be called on a ressource when it's no longer needed !
                    release: function () {
                        sound.removeEventListener('error', mediaError);
                        sound.removeEventListener('ended', endedHandler);
                        sound.removeEventListener('canplay',canplayHandler);
                        sound.removeEventListener('playing',playingHandler);
                        sound.removeEventListener('canplaythrough',canplaythroughHandler);
                        sound.src = '';
                        console.log('Html5 Audio object was destroyed ' + src);
                    },
                    // Moves the position within the audio file.
                    seekTo: function (milliseconds) {
                        sound.currentTime = milliseconds / 1000;
                    },
                    // Set the volume for audio playback (between 0.0 and 1.0).
                    setVolume: function (volume) {
                        sound.volume = volume;
                    },
                    // Start recording an audio file.
                    startRecord: function () {
                    },
                    // Stop recording an audio file.
                    stopRecord: function () {
                    },
                    // Stop playing an audio file.
                    stop: function () {
                        sound.pause();
                        if (mediaStatus) {
                            mediaStatus($window.Media.MEDIA_STOPPED);
                        }
                        if (mediaSuccess) {
                            mediaSuccess();
                        }
                    }
                };
            }

            // media fallback: only when not running on device
            if (!isRunningOnDevice ) {
                $window.Media = Html5Media;
                $window.Media.MEDIA_NONE = 0;
                $window.Media.MEDIA_STARTING = 1;
                $window.Media.MEDIA_RUNNING = 2;
                $window.Media.MEDIA_PAUSED = 3;
                $window.Media.MEDIA_STOPPED = 4;
            }


            var mediaOptions = { playAudioWhenScreenIsLocked : false };

            var MediaSrv = {
                soundsEnabled: true//@todo(igor) should be set in config phase
            };

            MediaSrv.enableSounds = function enableSounds(shouldEnable){
                MediaSrv.soundsEnabled = shouldEnable;
            };

            MediaSrv.loadSound = function loadMedia(src,successFn,failFn,statusCheckFn,isInternalPath) {
                var MediaConstructor;

                if(!isRunningOnDevice){
                    MediaConstructor  = Html5Media;
                }

                if(!MediaConstructor){
                    var INTERNAL_PATH_PREFIX_REGEX = /^(cdvfile:\/\/|documents:\/\/)/;
                    if(isInternalPath || src.match(INTERNAL_PATH_PREFIX_REGEX)){
                        MediaConstructor = $window.Media;
                    }else{
                        MediaConstructor = Html5Media;

                        //if(ionic.Platform.isAndroid()){
                        //    var isExternalGet = !!src.match(/^http/);
                        //    if(!isExternalGet){
                        //        src = '/android_asset/www/' + src;
                        //    }
                        //}
                    }

                }

                function failFnMain(e) {
                    var errMsg = 'MediaSrv: fail to load sound, src: '+src;
                    console.error(errMsg, e);
                    if(angular.isDefined($window.atatus) && angular.isFunction($window.atatus.notify)) {
                        $window.atatus.notify(errMsg);
                    }
                    // call failFn pass to loadSound
                    if(angular.isDefined(failFn) && angular.isFunction(failFn)) {
                        failFn(e);
                    }
                }

                var sound = new MediaConstructor(src,
                    successFn || angular.noop,
                    failFnMain || failFn || angular.noop,
                    statusCheckFn || angular.noop
                );

                return sound;
            };

            MediaSrv.setVolume = function setVolume(media, volume) {
                if (!MediaSrv.soundsEnabled){
                    return;
                }

                if (media.setVolume) {
                    media.setVolume(volume);
                }
                else {
                    media.volume = volume;
                }
            };

            MediaSrv.playMedia = function playMedia(media, options) {

                if (!MediaSrv.soundsEnabled) {
                    return;
                }

                if (typeof $window.Media === 'undefined') {
                    media.load();
                    media.play();
                }
                else {
                    if (!options){
                        options = mediaOptions;
                    }

                    media.play(options);
                }
            };

            MediaSrv.playSound = function(soundSrc,elementId){
                //if(ionic.Platform.isAndroid()){
                //    soundSrc = '/android_asset/www/' + soundSrc;
                //}
                if(!MediaSrv.soundsEnabled){
                    return;
                }

                var audioSelector = 'audio#' + elementId;
                if(!document.querySelector(audioSelector)){
                    var bodyElement = angular.element(document.querySelector('body'));
                    var template = '<audio id="%elementId%" webkit-playsinline><source src="%src%" type="audio/mp3"></audio>';
                    template = template.replace('%elementId%',elementId);
                    template = template.replace('%src%',soundSrc);
                    bodyElement.append(template);
                }
                var soundAudio = MediaSrv.loadMedia(soundSrc, elementId);
                MediaSrv.setVolume(soundAudio, 0.1);
                MediaSrv.playMedia(soundAudio);

            };

            MediaSrv.getContentPath = function getContentPath() {
                //if (!ionic.Platform.device().platform) {
                //    return ENV.contentDir + '/media/';
                //}
                //
                //var path = 'offline/media/';
                //if(ionic.Platform.isAndroid()){
                //    path = '/android_asset/www/' + path;
                //}
                //return path;
            };

            MediaSrv.newMedia = function newMedia(src, successCallback, errorCallback, statusCallback) {
                return new $window.Media(src, successCallback, errorCallback, statusCallback);
            };

            return MediaSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').filter('secondsToTime', [
        function () {
            return function (totalSeconds,format) {
                var min = parseInt(totalSeconds / 60);
                var paddedMin = min >= 10 ? min : '0' + min;
                var sec = parseInt(totalSeconds % 60);
                var paddedSec = sec >= 10 ? sec: '0' + sec;
                return format.replace('mm',paddedMin)
                    .replace('m',min)
                    .replace('ss',paddedSec)
                    .replace('s',sec);
            };
        }
    ]);
})(angular);

angular.module('znk.infra.znkAudioPlayer').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkAudioPlayer/svg/play-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 55.7 55.7\" class=\"play-icon\">\n" +
    "    <style>\n" +
    "        .play-icon {\n" +
    "            enable-background:new 0 0 55.7 55.7;\n" +
    "        }\n" +
    "    </style>\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:none;stroke:#231F20;stroke-width:3;stroke-miterlimit:10;}\n" +
    "	.st1{fill:#231F20;}\n" +
    "</style>\n" +
    "<circle class=\"st0\" cx=\"27.8\" cy=\"27.8\" r=\"26.3\"/>\n" +
    "<path class=\"st1\" d=\"M22.7,16.6L39,26.1c1.4,0.8,1.4,2.8,0,3.6L22.7,39c-1.4,0.8-3.1-0.2-3.1-1.8V18.4\n" +
    "	C19.6,16.8,21.3,15.8,22.7,16.6z\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/templates/znkAudioPlayButton.template.html",
    "<ng-switch on=\"audioPlayer.currState\" translate-namespace=\"ZNK_AUDIO_PLAYER\">\n" +
    "    <div class=\"play-button-wrapper\"\n" +
    "         ng-switch-when=\"1\">\n" +
    "        <button class=\"play-button\" ng-click=\"audioPlayer.currState = audioPlayer.STATE_ENUM.PLAYING\">\n" +
    "            <svg-icon name=\"play\"></svg-icon>\n" +
    "            <span class=\"play-audio-text\" translate=\".PLAY_AUDIO\"></span>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "    <div class=\"znk-audio-player-wrapper\">\n" +
    "        <znk-audio-player ng-switch-when=\"2\"\n" +
    "                          source=\"d.source\"\n" +
    "                          type=\"d.type\"\n" +
    "                          on-ended=\"audioPlayer.audioEnded(allowReplay)\"\n" +
    "                          auto-play=\"true\">\n" +
    "        </znk-audio-player>\n" +
    "    </div>\n" +
    "    <div class=\"ended-msg\"\n" +
    "         ng-switch-when=\"3\">\n" +
    "        <span translate=\".THIS_VIDEO_ALREADY_PLAYED\"></span>\n" +
    "    </div>\n" +
    "</ng-switch>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/templates/znkAudioPlayer.template.html",
    "<div class=\"time-display time-passed\" ng-if=\"::d.type === 1\"></div>\n" +
    "<!--<i ng-if=\"::d.type === 2\"-->\n" +
    "   <!--class=\"player-control\"-->\n" +
    "   <!--ng-click=\"d.playOrPause()\">-->\n" +
    "<!--</i>-->\n" +
    "<ng-switch on=\"d.type\" class=\"progress-container\">\n" +
    "    <div ng-switch-when=\"1\" class=\"only-progress-wrapper\">\n" +
    "        <div class=\"audio-progress\"></div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"2\" class=\"range-progress-wrapper range\">\n" +
    "        <input type=\"range\" min=\"0\" max=\"0\" step=\"1\" value=\"0\"/>\n" +
    "    </div>\n" +
    "</ng-switch>\n" +
    "<div class=\"time-display time-left\"></div>\n" +
    "\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/templates/znkImageAudio.template.html",
    "<div class=\"wrapper\" ng-class=\"{'no-footer': hideFooter}\">\n" +
    "    <!--<div class=\"bg-img only-tablet\" ng-style=\"{'background-image': 'url(' + d.blurredImage + ')'}\"></div>-->\n" +
    "    <div class=\"inner-section\">\n" +
    "        <img class=\"inner\" ng-src=\"{{::d.image}}\">\n" +
    "    </div>\n" +
    "    <div class=\"audio-footer inverted\" ng-if=\"::!hideFooter\">\n" +
    "        <znk-audio-play-button\n" +
    "            switch-init=\"audioPlayer.currState\"\n" +
    "            source=\"source\"\n" +
    "            on-ended=\"audioPlayer.audioEnded()\"\n" +
    "            auto-play=\"autoPlayGetter()\">\n" +
    "        </znk-audio-play-button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
