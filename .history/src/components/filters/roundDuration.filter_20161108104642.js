(function() {
'use strict';

    angular
        .module('znk.infra.filters')
        .filter('roundDuration', Filter);

    function Filter() {
        return FilterFilter;

        ////////////////

        function FilterFilter(Params) {
            return Params;
        }
    }
})();