(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.analytics'])
        .config(['AnalyticsUtilitySrvProvider', function(AnalyticsUtilitySrvProvider) {
            AnalyticsUtilitySrvProvider.setDebugMode(true);
            AnalyticsUtilitySrvProvider.extendEventsConst({
                customEvent: 'Custom Event',
                appClose: "Custom App Close"
            });
            AnalyticsUtilitySrvProvider.registerEventTrack = function() {
                return 666;
            }
        }])
        .controller('Main', function ($scope, AnalyticsUtilitySrv) {

            var c = AnalyticsUtilitySrv.eventTrack();

            console.log(c);
        });
})(angular);
