(function() {
'use strict';

    angular
        .module('znk.infra.filters')
        .filter('Filter', Filter);

    function Filter() {
        return FilterFilter;

        ////////////////

        function FilterFilter(Params) {
            return Params;
        }
    }
})();