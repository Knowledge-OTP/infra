(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').provider('TimelineSrv', ['SvgIconSrvProvider', function () {

        var imgObj;

        this.setImages = function(obj) {
            imgObj = obj;
        };

        this.$get = ['$log', function($log) {
             return {
                 getImages: function() {
                     if (!angular.isObject(imgObj)) {
                         $log.error('TimelineSrv getImages: obj is not an object! imgObj:', imgObj);
                     }
                     return imgObj;
                 }
             }
        }];
    }]);
})(angular);

