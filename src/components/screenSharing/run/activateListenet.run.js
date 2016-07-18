(function(){
    angular.module('znk.infra.screenSharing').run(
        function(ScreenSharingEventsSrv){
            'ngInject';

            ScreenSharingEventsSrv.activate();
        }
    );
})();
