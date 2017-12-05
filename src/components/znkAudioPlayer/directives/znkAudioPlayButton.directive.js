
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').directive('znkAudioPlayButton',
        function znkAudioPlayerDrv() {
            'ngInject';
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
        });
})(angular);
