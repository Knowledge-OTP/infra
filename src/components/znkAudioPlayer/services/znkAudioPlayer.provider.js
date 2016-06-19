(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').provider('znkAudioPlayer', function () {

        var isMobile = false;

        this.$get = [function () {
            return {
                isMobile: function(){
                    return isMobile;
                }
            }
        }];
    });
})(angular);
