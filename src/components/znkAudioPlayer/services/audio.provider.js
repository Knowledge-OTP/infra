(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').provider('AudioSrv', function () {

        var isMobile = false;
        var isAndroid = false;

        this.setIsMobie = function(_isMobile){
            isMobile = _isMobile;
        };

        this.setIsAndroid = function(_isAndroid) {
            isAndroid = _isAndroid;
        };

        this.$get = [function () {
            return {
                isMobile: function(){
                    return isMobile;
                },
                isAndroid: function() {
                  return isAndroid;
                }
            };
        }];
    });
})(angular);
