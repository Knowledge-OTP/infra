'use strict';

(function (angular) {

    angular.module('znk.infra.znkAudioPlayer').directive('znkImageAudio', ['AudioSrv',
        function znkImageAudio(AudioSrv) {

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
                    scope.d = {
                        image: scope.imageGetter(),
                        blurredImage: angular.isDefined(scope.blurredImageGetter) ? scope.blurredImageGetter : undefined,
                        isMobile: AudioSrv.isMobile()
                    };

                    var STATE_ENUM = {
                        START_PLAY: 1,
                        PLAYING: 2,
                        ALREADY_PLAYED: 3
                    };

                    var allowReplay = scope.allowReplay();

                    scope.audioPlayer = {
                        STATE_ENUM: STATE_ENUM,
                        audioEnded: function (allowReplayTemp){
                            scope.onEnded();
                            allowReplay = allowReplayTemp;
                            scope.audioPlayer.currState = allowReplay ? STATE_ENUM.START_PLAY : STATE_ENUM.ALREADY_PLAYED;
                        }
                    };

                    if(scope.showAsDone && !allowReplay){
                        scope.audioPlayer.currState = STATE_ENUM.ALREADY_PLAYED;
                    }else{
                        scope.audioPlayer.currState = scope.autoPlayGetter() ? STATE_ENUM.PLAYING : STATE_ENUM.START_PLAY;
                    }


                    scope.$watch('audioPlayer.currState', function (state) {
                        scope.isPlaying = state === STATE_ENUM.PLAYING;
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
