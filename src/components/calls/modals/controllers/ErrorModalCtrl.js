(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('ErrorModalCtrl',
        function ($scope, CallsUiSrv) {
            'ngInject';
            $scope.errorMessage = this.modalData.errorMessage;
            $scope.closeModal = CallsUiSrv.closeModal;
        }
    );
})(angular);
