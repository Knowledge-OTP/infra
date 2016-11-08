(function() {
'use strict';
/*
@param time (in milliseconds)
*/ 
    angular
        .module('znk.infra.filters')
        .filter('roundDuration', Filter);

    function Filter($filter) {
        'ngInject';
        return function FilterFilter(time) {
            var ONE_MIN_IN_MILLISECONDS = 60000;
            var ONE_HOUR_IN_MILLISECONDS = 3600000;
            var remainedSec;
            var remainedMin;
            var numOfSec;
            var numOfMin;
            var numOfHours;
            var filteredTime;
            if (time <= ONE_MIN_IN_MILLISECONDS) {
                filteredTime = time/1000 + ' sec';
            } else if (time % ONE_MIN_IN_MILLISECONDS < time && time > 0 && time < 3600000) {
                remainedSec = time % ONE_MIN_IN_MILLISECONDS;
                numOfMin = Math.round(time/ONE_MIN_IN_MILLISECONDS) + ' min ';
                numOfSec = remainedSec ? Math.round(remainedSec /1000) + ' sec': '';
                filteredTime = numOfMin + numOfSec;
            } else {
                remainedMin = time%ONE_HOUR_IN_MILLISECONDS;
                remainedSec = remainedMin%ONE_MIN_IN_MILLISECONDS;
                numOfHours = Math.floor(time/ONE_HOUR_IN_MILLISECONDS) + 'h ';
                numOfMin = remainedMin && remainedMin ? Math.floor(remainedMin/ONE_MIN_IN_MILLISECONDS) + ' min ': '';
                numOfSec = remainedSec ? Math.round(remainedSec/1000) + ' sec': '';
                filteredTime = numOfHours + numOfMin + numOfSec;
            }
            return filteredTime;
        }
    }
})();