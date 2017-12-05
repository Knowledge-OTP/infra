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

    angular.module('znk.infra.analytics').service('znkAnalyticsUtilSrv', function ($log) {
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
    });
})(angular);
