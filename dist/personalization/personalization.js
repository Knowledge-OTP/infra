(function (angular) {
    'use strict';

    angular.module('znk.infra.personalization', ['znk.infra.content']);
})(angular);

(function (angular) {
    'use strict';
    
    angular.module('znk.infra.personalization')
        .service('PersonalizationSrv',
            ["StorageRevSrv", "$log", "$q", function (StorageRevSrv, $log, $q) {
                'ngInject';

                var self = this;

                this.getPersonalizationData = function () {
                    var data = {
                        exerciseType: 'personalization'
                    };

                    return StorageRevSrv.getContent(data);
                };

                this.getExamOrder = function () {
                    return self.getPersonalizationData().then(function (personalizationData) {
                        var errorMsg = 'PersonalizationSrv getExamOrder: personalization.examOrder is not array or empty!';
                        if (!angular.isArray(personalizationData.examOrder) || personalizationData.examOrder.length === 0) {
                            $log.error(errorMsg);
                            return $q.reject(errorMsg);
                        }
                        return personalizationData.examOrder;
                    });
                };
            }]
        );
})(angular);


angular.module('znk.infra.personalization').run(['$templateCache', function($templateCache) {

}]);
