(function() {
'use strict';
/*
    @Params time (in milliseconds)
*/ 
    angular
        .module('znk.infra.filters')
        .filter('roundDuration', Filter);

    function Filter() {
        return function FilterFilter(time) {
            return Params;
        }
    }
})();