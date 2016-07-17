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
