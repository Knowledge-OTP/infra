(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.analytics'])
        .config(['znkAnalyticsSrvProvider', function(znkAnalyticsSrvProvider) {
            znkAnalyticsSrvProvider.setDebugMode(true);
            znkAnalyticsSrvProvider.extendEventsConst({
                customEvent: 'Custom Event',
                appClose: "Custom App Close"
            });
            znkAnalyticsSrvProvider.setEventsHandler(['fakeAnalytics', function(fakeAnalytics) {
                return {
                    eventTrack: function(eventObj) {
                        console.log('eventTrack', eventObj);
                        return fakeAnalytics.eventTrack(eventObj);
                    },
                    timeTrack: function(eventObj) {
                        console.log('timeTrack', eventObj);
                        return fakeAnalytics.timeTrack(eventObj);
                    },
                    pageTrack: function(eventObj) {
                        console.log('pageTrack', eventObj);
                        return fakeAnalytics.pageTrack(eventObj);
                    },
                    setUsername: function(eventObj) {
                        console.log('setUsername', eventObj);
                        return fakeAnalytics.setUsername(eventObj);
                    },
                    setUserProperties: function(eventObj) {
                        console.log('setUserProperties', eventObj);
                        return fakeAnalytics.setUserProperties(eventObj);
                    }
                }
            }]);
        }])
        .service('fakeAnalytics', function() {
               this.timeTrack = function(eventObj) {
                   console.log('fake - timeTrack', eventObj);
                   return eventObj;
               };
            this.eventTrack = function(eventObj) {
                console.log('fake - eventTrack', eventObj);
                return eventObj;
            };
            this.pageTrack = function(eventObj) {
                console.log('fake - pageTrack', eventObj);
                return eventObj;
            };
            this.setUsername = function(eventObj) {
                console.log('fake - setUsername', eventObj);
                return eventObj;
            };
            this.setUserProperties = function(eventObj) {
                console.log('fake - setUserProperties', eventObj);
                return eventObj;
            };


        })
        .controller('Main', function ($scope, znkAnalyticsSrv) {

            znkAnalyticsSrv.timeTrack({ dayTime: true, eventName: 'signUp' });

            znkAnalyticsSrv.eventTrack({ eventName: 'testCompleted', props: {
                testId: 1
            },
                questionsArr: [
                    {
                        userAnswer: 1,
                        isAnsweredCorrectly: false
                    },
                    {
                        userAnswer: 2,
                        isAnsweredCorrectly: true
                    },
                    {},
                    {
                        userAnswer: 4,
                        isAnsweredCorrectly: false
                    },
                    {
                        userAnswer: 5,
                        isAnsweredCorrectly: true
                    }
                ]
            });
        });
})(angular);
