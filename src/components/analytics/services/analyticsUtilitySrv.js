(function (angular) {
    'use strict';

    var eventsConst = {
       appOpen: 'App Open',
       appClose: 'App Close',
       signUp: 'Sign Up',
       login: 'Login',
       getStartedClicked: 'Get Started Clicked',
       diagnosticStart: 'Diagnostic Start',
       diagnosticEnd: 'Diagnostic End',
       diagnosticSectionStarted: 'Diagnostic Section Started',
       diagnosticSectionCompleted: 'Diagnostic Section Completed',
       diagnosticsSkipAudioClicked: 'Diagnostics Skip Audio Clicked',
       workoutStarted: 'Workout Started',
       workoutCompleted: 'Workout Completed',
       tutorialViewed: 'Tutorial Viewed',
       tutorialClosed: 'Tutorial Closed',
       flashcardStackViewed: 'Flashcard Stack Viewed',
       flashcardStackCompleted: 'Flashcard stack Completed',
       performanceBannerClicked: 'Performance Banner Clicked',
       performanceClosed: 'Performance Closed',
       tipsAndTricksBannerClicked: 'Tips & Tricks Banner Clicked',
       flashcardsBannerClicked: 'Flashcards Banner Clicked',
       fullTestsBannerClicked: 'Full tests Banner Clicked',
       miniTestsBannerClicked: 'Mini Tests Banner Clicked',
       writtenSolutionClicked: 'Written Solution Clicked',
       writtenSolutionClosed: 'Written Solution Closed',
       sectionStarted: 'Section Started',
       sectionCompleted: 'Section Completed',
       testCompleted: 'Test Completed',
       exception: 'Exception',
       upgradeAppVersion: 'Upgrade App Version',
       firstTimeAppOpen: 'First Time App Open',
       appRatePopupOpened: 'App Rate Popup Opened',
       rateButtonClicked: 'Rate Button Clicked',
       cancelRateButtonClicked: 'Cancel Rate Button Clicked',
       laterRateButtonClicked: 'Later Rate Button Clicked',
       purchaseModalOpened: 'Purchase Modal opened',
       purchaseOrderStarted: 'Order Started',
       purchaseOrderCompleted: 'Order Completed',
       purchaseOrderCancelled: 'Order Cancelled'
    };

    angular.module('znk.infra.analytics').provider('AnalyticsUtilitySrv',[
        function () {

            var debug = false;

            var knownHandlers = {
                registerEventTrack: 'eventTrack'
            };

            this.setDebugMode = function(mode) {
                debug = mode;
            };

            this.extendEventsConst = function(moreEvents) {
                angular.extend(eventsConst, moreEvents);
            };

            this.$get = ['$log', function($log) {
                 return {
                 getEventsConst: function() {
                     return eventsConst;
                 },
                 getDebugMode: function() {
                     return debug;
                 },
                 getTimeInDay: function() {
                     var date = new Date();
                     var hours = date.getHours();
                     var timeStr;

                     if(hours >= 6 && hours < 12) {
                         timeStr = 'Morning';
                     } else if(hours >= 12 && hours < 18) {
                         timeStr = 'Afternoon';
                     } else if(hours >= 18 && hours < 24) {
                         timeStr = 'Evening';
                     } else if(hours >= 24 && hours < 6) {
                         timeStr = 'Night';
                     } else {
                         timeStr = date.toString();
                     }

                     return timeStr;
                 },

                 eventTrack: function(evtObj) {
                     console.log(444);
                    //var eventFromConst, props;
                    //
                    //if(!evtObj || !evtObj.eventName) {
                    //    $log.error('AnalyticsUtilitySrv: evtObj not exist or eventName is undefined! evtObj:', evtObj);
                    //}
                    //
                    //eventFromConst = eventsConst[evtObj.eventName];
                    //
                    //if(!eventFromConst) {
                    //    $log.error('AnalyticsUtilitySrv: eventName not matching any event in eventsConst! eventName:', evtObj.eventName);
                    //}
                    //
                    //if(!evtObj.props) { evtObj.props = {}; }
                    //// added for google analytics
                    //props = angular.extend({}, evtObj.props, {
                    //    category: 'user interaction'
                    //});
                    //
                    //$analytics.eventTrack(eventFromConst, props);
                    //
                    //if(evtObj.userTimings) {
                    //    this.timeTrack(evtObj);
                    //}
                }

                //timeTrack: function(evtObj) {
                //    var eventFromConst = angular.isString(evtObj.userTimings) ? eventsConst[evtObj.userTimings] : eventsConst[evtObj.eventName];
                //    if(!eventFromConst) {
                //        $log.error('AnalyticsUtilitySrv: userTimings event not matching any event in eventsConst! evtObj:', evtObj);
                //    }
                //    // to avoid angulartics.google.analytics registerUserTimings error
                //    // we add the timingCategory, timingVar and timingValue
                //    // can be filled with real data, if needed.
                //    $analytics.userTimings({
                //        timingCategory: ' ',
                //        timingVar: ' ',
                //        timingValue: ' '
                //    }, eventFromConst);
                //},
                //
                //setUserProperties: function(props) {
                //    if(!props) {
                //        $log.error('AnalyticsUtilitySrv setUserProperties: props is empty');
                //    }
                //    $analytics.setUserProperties(props);
                //},
                //getQuestionStat: function(arr) {
                //    return arr.reduce(function(previousValue, currentValue) {
                //        if(currentValue.userAnswer) {
                //            if(currentValue.isAnsweredCorrectly) {
                //                previousValue.correct++;
                //            } else {
                //                previousValue.wrong++;
                //            }
                //        } else {
                //            previousValue.skip++;
                //        }
                //        return previousValue;
                //    },{ correct: 0, wrong: 0, skip: 0 });
                //},
                //setUsername: function(userName) {
                //    if(!userName) {
                //        $log.error('AnalyticsUtilitySrv setUsername: userName is empty');
                //    }
                //    $analytics.setUsername(userName);
                //},
                //pageTrack: function(url) {
                //    if(!url) {
                //        $log.error('AnalyticsUtilitySrv pageTrack: url is empty');
                //    }
                //    $analytics.pageTrack(url);
                //}
              }
            }];

        }
    ]).run(['AnalyticsUtilitySrv', '$window', function(AnalyticsUtilitySrv, $window) {
        var isDebugMode = AnalyticsUtilitySrv.getDebugMode();
        if(isDebugMode) {
            $window.znkAnalyticsEvents = AnalyticsUtilitySrv.getEventsConst();
        }
    }]);
})(angular);
