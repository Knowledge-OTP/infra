(function (angular) {
    'use strict';

    angular.module('demo', ['znk.infra.znkAudioPlayer'])
        .config(function(){

        })
        .service('ENV', function () {
            this.debug = true;
        })
        .controller('Main', function () {

        });

})(angular);
