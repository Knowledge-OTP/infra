(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('ErrorModalCtrl',
        function () {
            'ngInject';
            var errorMessage = this.modalData.errorMessage;
        }
    );
})(angular);
