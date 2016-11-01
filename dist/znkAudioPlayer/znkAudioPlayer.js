(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer', [
        'znk.infra.znkMedia',
        'pascalprecht.translate',
        'znk.infra.svgIcon'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znk-audio-player-play': 'components/znkAudioPlayer/svg/play-icon.svg',
                    'znk-audio-player-pause': 'components/znkAudioPlayer/svg/pause-icon.svg',
                    'znk-audio-player-close': 'components/znkAudioPlayer/svg/close-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

'use strict';

(function (angular) {

    angular.module('znk.infra.znkAudioPlayer').directive('audioManager',
        function () {
            return {
                require: 'audioManager',
                controller: [
                    '$scope', '$attrs',
                    function ($scope, $attrs) {
                        var resultData = $scope.$eval($attrs.audioManager);

                        this.saveAsPlayedThrough = function saveAsPlayedThrough(groupData) {
                            resultData.playedAudioArticles = resultData.playedAudioArticles || {};
                            if (angular.isUndefined(resultData.playedAudioArticles[groupData.id])) {
                                resultData.playedAudioArticles[groupData.id] = groupData.id;
                                resultData.playedAudioArticles = angular.copy(resultData.playedAudioArticles);
                                resultData.$save();
                            }
                        };

                        this.wasPlayedThrough = function (groupData) {
                            return !!resultData.playedAudioArticles && angular.isDefined(resultData.playedAudioArticles[groupData.id]);
                        };

                        this.canReplayAudio = function canReplayAudio() {
                            return resultData.isComplete;
                        };
                    }]
            };
        });

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
                    onStart: '&?',
                    onEnded: '&',
                    switchInitGetter: '&switchInit',
                    allowReplay: '&?',
                    showAsDone: '=?'
                },
                link:function(scope){
                    scope.d = {};

                    var STATE_ENUM = {
                        START_PLAY: 1,
                        PLAYING: 2,
                        ALREADY_PLAYED: 3
                    };

                    scope.d.statesEnum = STATE_ENUM;

                    scope.d.source = angular.isDefined(scope.sourceGetter) ? scope.sourceGetter() : undefined;
                    scope.d.type = angular.isDefined(scope.typeGetter) ? scope.typeGetter() : scope.d.statesEnum.START_PLAY;

                    var allowReplay =  angular.isDefined(scope.allowReplay) ? scope.allowReplay() : false;
                    var autoPlay = angular.isDefined(scope.autoPlayGetter) ? scope.autoPlayGetter() : false;
                    var showAsDone = !!scope.showAsDone;

                    scope.audioPlayer = {
                        STATE_ENUM: STATE_ENUM,
                        audioEnded: function (){
                            if(angular.isDefined(scope.onEnded)) {
                                scope.onEnded();
                            }
                            scope.audioPlayer.currState = allowReplay ? STATE_ENUM.START_PLAY : STATE_ENUM.ALREADY_PLAYED;
                        }
                    };

                    if(showAsDone && !allowReplay){
                        scope.audioPlayer.currState = STATE_ENUM.ALREADY_PLAYED;
                    }else{
                        scope.audioPlayer.currState = autoPlay ? STATE_ENUM.PLAYING : STATE_ENUM.START_PLAY;
                    }

                    scope.$watch('audioPlayer.currState', function (state) {
                        scope.isPlaying = state === STATE_ENUM.PLAYING;
                    });

                    scope.$watch('autoPlayGetter()', function(playStatus) {
                        scope.audioPlayer.currState = playStatus ? STATE_ENUM.PLAYING : STATE_ENUM.START_PLAY;
                    });

                    scope.$watch('showAsDone', function (showAsDone) {
                        if(showAsDone && !allowReplay){
                            scope.audioPlayer.currState = STATE_ENUM.ALREADY_PLAYED;
                        }
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
                    onEnded: '&'
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
                        },
                        stop: function() {
                            sound.stop();
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

    angular.module('znk.infra.znkAudioPlayer').directive('znkImageAudio', [
        function znkImageAudio() {

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
                    showSkipOption: '&?',
                    onPlayerStart: '&?',
                    autoPlayGetter: '&autoPlay',
                    blurredImageGetter: '&?blurredImage'
                },
                link: function (scope) {

                    scope.d = {
                        image: scope.imageGetter(),
                        blurredImage: angular.isDefined(scope.blurredImageGetter) ? scope.blurredImageGetter : undefined
                    };

                    function isSkipOptionExist() {
                       return angular.isDefined(scope.showSkipOption) && scope.showSkipOption();
                    }

                    scope.d.skippedHandler = function() {
                        scope.showAsDone = true;
                        scope.d.showSkipButton = false;
                        scope.onEnded();
                    };

                    scope.d.onPlayerStart = function() {
                        if (isSkipOptionExist()) {
                            scope.d.showSkipButton = true;
                        }
                        if (scope.onPlayerStart) {
                            scope.onPlayerStart();
                        }
                    };

                    if (isSkipOptionExist()) {
                        var onEnded = scope.onEnded;  // reference to onEnded function.
                        scope.onEnded = function(){ // extend the onEnded function (if passed).
                            if(onEnded){
                                onEnded();
                            }
                            scope.d.showSkipButton = false;
                        };
                    }
                }
            };
        }]);

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
  $templateCache.put("components/znkAudioPlayer/svg/close-icon.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    class=\"znk-audio-player-close-svg\"\n" +
    "    viewBox=\"-596.6 492.3 133.2 133.5\">\n" +
    "    <style>\n" +
    "        .znk-audio-player-close-svg {\n" +
    "        }\n" +
    "    </style>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/svg/pause-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-359 103.4 28 36.6\" class=\"znk-audio-player-pause-svg\">\n" +
    "    <style>\n" +
    "        .znk-audio-player-pause-svg  .znk-audio-player-pause-svg-rect {\n" +
    "            width: 7px;\n" +
    "            height: 20px;\n" +
    "        }\n" +
    "    </style>\n" +
    "<rect class=\"znk-audio-player-pause-svg-rect\" x=\"-353\" y=\"110\" />\n" +
    "<rect class=\"znk-audio-player-pause-svg-rect\" x=\"-340.8\" y=\"110\" />\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/svg/play-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 55.7 55.7\" class=\"znk-audio-player-play-svg\">\n" +
    "    <style>\n" +
    "        .znk-audio-player-play-svg {\n" +
    "            enable-background:new 0 0 55.7 55.7;\n" +
    "        }\n" +
    "    </style>\n" +
    "<style type=\"text/css\">\n" +
    "	.znk-audio-player-play-svg .st0{fill:none;stroke:#231F20;stroke-width:3;stroke-miterlimit:10;}\n" +
    "	.znk-audio-player-play-svg .st1{fill:#231F20;}\n" +
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
    "        <button class=\"play-button\" ng-click=\"audioPlayer.currState = audioPlayer.STATE_ENUM.PLAYING; onStart();\">\n" +
    "            <svg-icon name=\"znk-audio-player-play\"></svg-icon>\n" +
    "            <span class=\"play-audio-text\" translate=\".PLAY_AUDIO\"></span>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "    <div class=\"znk-audio-player-wrapper\">\n" +
    "        <znk-audio-player ng-switch-when=\"2\"\n" +
    "                          source=\"d.source\"\n" +
    "                          type=\"d.type\"\n" +
    "                          on-ended=\"audioPlayer.audioEnded()\"\n" +
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
    "<div ng-if=\"::d.type === 2\"\n" +
    "     class=\"player-close-svg-wrapper\"\n" +
    "     ng-click=\"d.stop()\">\n" +
    "    <svg-icon\n" +
    "        class=\"player-close-svg\"\n" +
    "        name=\"znk-audio-player-close\">\n" +
    "    </svg-icon>\n" +
    "</div>\n" +
    "<div ng-if=\"::d.type === 2\"\n" +
    "   class=\"player-control\"\n" +
    "   ng-init=\"d.playStatus = false\"\n" +
    "   ng-switch=\"d.playStatus\"\n" +
    "   ng-click=\"d.playOrPause(); d.playStatus = !d.playStatus\">\n" +
    "  <svg-icon ng-switch-when=\"true\"\n" +
    "            class=\"player-play-svg\"\n" +
    "            name=\"znk-audio-player-play\">\n" +
    "  </svg-icon>\n" +
    "  <svg-icon ng-switch-when=\"false\"\n" +
    "              class=\"player-pause-svg\"\n" +
    "              name=\"znk-audio-player-pause\">\n" +
    "  </svg-icon>\n" +
    "</div>\n" +
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
    "<div class=\"wrapper\" ng-class=\"{'no-footer': hideFooter}\" translate-namespace=\"ZNK_IMAGE_AUDIO\">\n" +
    "    <div class=\"inner-section\">\n" +
    "        <img class=\"inner\" ng-src=\"{{::d.image}}\">\n" +
    "    </div>\n" +
    "    <div class=\"audio-footer inverted\" ng-if=\"::!hideFooter\"  ng-class=\"{'showSkipButton': d.showSkipButton}\">\n" +
    "        <znk-audio-play-button\n" +
    "            switch-init=\"audioPlayer.currState\"\n" +
    "            source=\"source\"\n" +
    "            on-ended=\"onEnded()\"\n" +
    "            on-start=\"d.onPlayerStart()\"\n" +
    "            allow-replay=\"allowReplay()\"\n" +
    "            show-as-done=\"showAsDone\"\n" +
    "            auto-play=\"autoPlayGetter()\">\n" +
    "        </znk-audio-play-button>\n" +
    "\n" +
    "        <div class=\"skip-audio-button\" ng-if=\"d.showSkipButton\" ng-click=\"d.skippedHandler()\">\n" +
    "            <div translate=\".SKIP\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
