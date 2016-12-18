(function(){
    'use strict';

    angular.module('znk.infra.liveSession').run(
        function(LiveSessionEventsSrv){
            'ngInject';
            LiveSessionEventsSrv.activate();
        }
    );
})();
