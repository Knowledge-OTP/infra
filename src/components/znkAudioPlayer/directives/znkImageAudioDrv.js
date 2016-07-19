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
                    showAsDone: '&?',
                    allowReplay: '&?',
                    showSkipOption: '&?',
                    autoPlayGetter: '&autoPlay',
                    blurredImageGetter: '&?blurredImage'
                },
                link: function (scope) {
                    $translatePartialLoader.addPart('znkAudioPlayer');

                    scope.d = {
                        image: scope.imageGetter(),
                        blurredImage: angular.isDefined(scope.blurredImageGetter) ? scope.blurredImageGetter : undefined,
                        showAsDone: angular.isDefined(scope.showAsDone) ? scope.showAsDone : false
                    };

                    scope.d.skippedHandler = function(){
                        scope.d.showAsDone = true;
                        scope.d.showSkipButton = false;
                    };

                    if(angular.isDefined(scope.showSkipOption) && scope.showSkipOption()){
                        scope.d.showSkipButtonFn = function(){
                            scope.d.showSkipButton = true;
                        };

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
