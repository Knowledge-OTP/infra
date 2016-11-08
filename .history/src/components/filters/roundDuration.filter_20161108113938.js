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
            var remains;
            var numOfSec;
            var numOfMin;
            var numOfHours;
            if (time < ONE_MIN_IN_MILLISECONDS) {
                fliteredTime = time/1000 + ' sec';
            } else if (time % ONE_MIN_IN_MILLISECONDS < time && time > 0 && time < 3600000) {
                remanis = time % ONE_MIN_IN_MILLISECONDS;
                numOfMin = time/ONE_MIN_IN_MILLISECONDS;
                numOfSec = remain/1000;
                fliteredTime = numOfMin + ' min' + numOfSec + ' sec';
            }
            return fliteredTime;
        }
    }
})();