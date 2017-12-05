'use strict';

(function (angular) {

    angular.module('znk.infra.znkAudioPlayer').directive('znkImageAudio',
        function znkImageAudio() {
            'ngInject';
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
        });

})(angular);
