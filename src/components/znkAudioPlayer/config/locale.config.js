(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "ZNK_AUDIO_PLAYER": {
                        "PLAY_AUDIO": "PLAY AUDIO",
                        "THIS_VIDEO_ALREADY_PLAYED": "The audio has already been played."
                    },
                    "ZNK_IMAGE_AUDIO": {
                        "SKIP": "Skip"
                    }
                });
            });
})(angular);
