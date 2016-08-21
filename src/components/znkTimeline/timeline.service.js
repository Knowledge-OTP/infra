/**
 * TimelineSrv
 *   setImages ie:
 *                 {
 *                    tutorial: '{path to image}'
 *                 }
 *  setColors ie: {
 *                   0: '#75cbe8'
 *                }
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').provider('TimelineSrv', function () {

        var imgObj;

        var colorsObj = { 0: '#75cbe8', 1: '#f9d41b', 2: '#ff5895', 5: '#AF89D2', 6: '#51CDBA' };

        this.setImages = function(obj) {
            imgObj = obj;
        };

        this.setColors = function(obj) {
            colorsObj = obj;
        };

        this.$get = function($log) {
            'ngInject';

            var timelineSrvApi = {};

            function _baseFn(obj, methodName) {
                if (!angular.isObject(obj)) {
                    $log.error('TimelineSrv ' + methodName + ': obj is not an object! obj:', obj);
                }
                return obj;
            }

            timelineSrvApi.getImages =  _baseFn.bind(null, imgObj, 'getImages');

            timelineSrvApi.getColors =  _baseFn.bind(null, colorsObj, 'getColors');

            return timelineSrvApi;
        };
    });
})(angular);

