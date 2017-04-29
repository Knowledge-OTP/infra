(function (angular) {
    'use strict';

    angular.module('demo').config(function (znkAnalyticsSrvProvider) {
        znkAnalyticsSrvProvider.setEventsHandler(function () {
            return {
                eventTrack: angular.noop,
                timeTrack: angular.noop,
                pageTrack: angular.noop,
                setUsername: angular.noop,
                setUserProperties: angular.noop
            };
        });
    });
})(angular);
