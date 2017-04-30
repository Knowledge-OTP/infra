(function (angular) {
    'use strict';

    angular.module('znk.infra.znkMedia').factory('MediaSrv', [
        'ENV', '$q', '$window', '$log',
        function (ENV, $q, $window, $log) {

            var isRunningOnDevice = !!$window.cordova;

            var sound = window.Audio && new Audio();
            function Html5Media(src, mediaSuccess, mediaError, mediaStatus) {
                var audioEndedProm = $q.defer();

                if (typeof $window.Audio !== 'function' && typeof $window.Audio !== 'object') {
                    $log.debug('HTML5 Audio is not supported in this browser');
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

                    audioEndedProm.resolve();
                }
                sound.addEventListener('ended', endedHandler, false);

                function canplayHandler(){
                    $log.debug('Html5 audio load end ' + src);
                    if (mediaStatus) {
                        mediaStatus($window.Media.MEDIA_STARTING);
                    }
                }
                sound.addEventListener('canplay',canplayHandler, false);

                function canplaythroughHandler(){
                    $log.debug('Html5 audio load fully ended ' + src);
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

                $log.debug('starting Html5 audio load ' + src);
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
                        $log.debug('Html5 Audio object was destroyed ' + src);
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
                    },
                    onEnded: function(){
                        return audioEndedProm.promise;
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
                    $log.error(errMsg, e);
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
    angular.module('znk.infra.znkMedia',[]);
})(angular);

angular.module('znk.infra.znkMedia').run(['$templateCache', function($templateCache) {

}]);
