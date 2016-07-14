(function(){
    angular.module('znk.infra.screenSharing').run(
        function(ScreenSharingEventsrSrv){
            'ngInject';

            ScreenSharingEventsrSrv.activate();
        }
    );
})();
