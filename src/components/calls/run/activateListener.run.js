(function(){
    'use strict';

    angular.module('znk.infra.calls').run(
        function(CallsEventsSrv){
            'ngInject';

            CallsEventsSrv.activate();
        }
    );
})();
