(function (angular) {
    'use strict';

    angular.module('znk.infra.analytics', []);
})(angular);

/**
 * znkAnalyticsSrv
 *
 *   api:
 *      getEventsConst
 *      getDebugMode
 *      { handlers you register in config phase }
 */
(function (angular) {
    'use strict';

    var _eventsConst = {
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
        purchaseOrderPending: 'Order Pending',
        purchaseOrderCompleted: 'Order Completed',
        purchaseOrderCancelled: 'Order Cancelled'
    };

    angular.module('znk.infra.analytics').provider('znkAnalyticsSrv', function () {
        'ngInject';
        var debug = false;
        var eventsHandler;

        this.setDebugMode = function(mode) {
            debug = mode;
        };

        this.extendEventsConst = function(moreEvents) {
            angular.extend(_eventsConst, moreEvents);
        };

        this.setEventsHandler = function(_eventsHandler) {
            eventsHandler = _eventsHandler;
        };

        this.$get = ["$log", "$injector", "znkAnalyticsUtilSrv", function($log, $injector, znkAnalyticsUtilSrv) {

            var api = {
                getEventsConst: function() {
                    if(!_eventsConst) {
                        $log.error('znkAnalyticsSrv getEventsConst:  _eventsConst is missing!');
                    }
                    return _eventsConst;
                },
                getDebugMode: function() {
                    return debug;
                }
            };

            if(!eventsHandler) {
                $log.debug('znkAnalyticsSrv eventsHandler is missing!');
                return api;
            }

            var eventsFn = $injector.invoke(eventsHandler);
            znkAnalyticsUtilSrv.events.const = _eventsConst;

            angular.forEach(eventsFn, function(value, key) {
                var fn = znkAnalyticsUtilSrv.events.list[key];
                if(fn) {
                    api[key] = fn.bind(null, eventsFn[key]);
                } else {
                    $log.error('znkAnalyticsSrv key is missing in infra or incorrect! key:', key);
                }
            });

            return api;
        }];

    }).run(["znkAnalyticsSrv", "$window", function(znkAnalyticsSrv, $window) {
        'ngInject';
        var isDebugMode = znkAnalyticsSrv.getDebugMode();
        if(isDebugMode) {
            $window.znkAnalyticsEvents = znkAnalyticsSrv.getEventsConst();
        }
    }]);
})(angular);

(function (angular) {
    'use strict';

    function _getTimeInDay() {
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
    }

    function _getQuestionsStats(arr) {
        return arr.reduce(function(previousValue, currentValue) {
            if(currentValue.userAnswer) {
                if(currentValue.isAnsweredCorrectly) {
                    previousValue.correct++;
                } else {
                    previousValue.wrong++;
                }
            } else {
                previousValue.skip++;
            }
            return previousValue;
        },{ correct: 0, wrong: 0, skip: 0 });
    }

    angular.module('znk.infra.analytics').service('znkAnalyticsUtilSrv', ["$log", function ($log) {
        'ngInject';

        var self = this;

        function _extendProps(eventObj) {
            eventObj.props = eventObj.props || {};
            if(eventObj.dayTime) {
                eventObj.props.dayTime = _getTimeInDay();
            }
            if(eventObj.questionsArr) {
                eventObj.props = angular.extend({}, eventObj.props, _getQuestionsStats(eventObj.questionsArr));
            }
            return eventObj.props;
        }

        function _getNewEvent(eventObj) {
            var events = self.events.const;
            if(!events) {
                $log.error('znkAnalyticsUtilSrv events const not defined!', self.events);
                return;
            }
            var newEventObj = {};
            if(eventObj.eventName) {
                if(events[eventObj.eventName]) {
                    newEventObj.eventName = events[eventObj.eventName];
                } else if(eventObj.nameOnTheFly) {
                    newEventObj.eventName = eventObj.eventName;
                } else {
                    $log.error('znkAnalyticsUtilSrv eventName not matching any eky in events const key:', eventObj.eventName);
                }
            }
            newEventObj.props = _extendProps(eventObj);
            return newEventObj;
        }

        function _eventFn(fn, eventObj) {
            var newEventObj = _getNewEvent(eventObj);
            return fn(newEventObj);
        }

        this.events = {};

        this.events.list = {
            eventTrack: _eventFn,
            timeTrack: _eventFn,
            pageTrack: _eventFn,
            setUsername: _eventFn,
            setUserProperties: _eventFn
        };
    }]);
})(angular);

angular.module('znk.infra.analytics').run(['$templateCache', function ($templateCache) {

}]);
