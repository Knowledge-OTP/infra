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
        'ngInject';
        var imgObj = {
            drill: 'components/znkTimeline/svg/icons/timeline-drills-icon.svg',
            practice: 'components/znkTimeline/svg/icons/timeline-practice-icon.svg',
            game: 'components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg',
            tutorial: 'components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg',
            diagnostic: 'components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg',
            section: 'components/znkTimeline/svg/icons/timeline-test-icon.svg'
        };

        var colorsObj = { 0: '#75cbe8', 1: '#f9d41b', 2: '#ff5895', 5: '#AF89D2', 6: '#51CDBA' };

        this.setImages = function(obj) {
            imgObj = obj;
        };

        this.setColors = function(obj) {
            colorsObj = obj;
        };

        this.$get = function($log) {

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

