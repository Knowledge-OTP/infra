(function (angular) {
    'use strict';

    angular.module('content.mock', ['znk.infra.contentGetters'])
        .decorator('ContentSrv', function($delegate, $q){
            $delegate.getContent = function(data){
                var retContent = content[data.exerciseType];

                if(!retContent){
                    return $q.reject('Content not exists');
                }

                return $q.when(retContent);
            };

            return $delegate;
        });
})(angular);
