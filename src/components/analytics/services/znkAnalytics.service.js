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

        this.$get = ['$log', '$injector', 'znkAnalyticsUtilSrv', function($log, $injector, znkAnalyticsUtilSrv) {

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

    }).run(function(znkAnalyticsSrv, $window) {
        'ngInject';
        var isDebugMode = znkAnalyticsSrv.getDebugMode();
        if(isDebugMode) {
            $window.znkAnalyticsEvents = znkAnalyticsSrv.getEventsConst();
        }
    });
})(angular);
