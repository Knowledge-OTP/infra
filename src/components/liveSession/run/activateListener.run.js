(function(){
    'use strict';

    angular.module('znk.infra.liveSession').run(
        function(ActivePanelSrv, LiveSessionEventsSrv){
            'ngInject';
            ActivePanelSrv.loadActivePanel();
            LiveSessionEventsSrv.activate();
        }
    );
})();
