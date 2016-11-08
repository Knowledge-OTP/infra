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
            if (time < ONE_MIN_IN_MILLISECONDS) {
                time = time/1000 + ' sec';
            } else if (time % 60000 === 0 && time > 0) {
                Math.round(time/60000);

            }
            return time;
        }
    }
})();