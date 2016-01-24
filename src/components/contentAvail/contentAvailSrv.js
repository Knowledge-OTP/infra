(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail').service('ContentAvailSrv', [
        '$q', '$parse', 'InfraConfigSrv',
        function ($q, $parse, InfraConfigSrv) {
            var PURCHASED_ALL = 'all';

            function getUserPurchaseData(){
                var StorageService = InfraConfigSrv.getStorageService();
                var purchaseDataPath = StorageService.variables.appUserSpacePath + '/purchase';
                var defValues = {
                    daily: 0,
                    exam: {},
                    tutorial: {},
                    subscription: {}
                };
                return StorageService.get(purchaseDataPath,defValues);
            }

            function getFreeContentData(){
                var StorageService = InfraConfigSrv.getStorageService();
                var freeContentPath = 'freeContent';
                var defValues = {
                    daily: 0,
                    exam: {},
                    tutorial: {}
                };
                return StorageService.get(freeContentPath,defValues);
            }

            function idToKeyInStorage(id){
                return 'id_' + id;
            }

            function _hasSubscription(subscriptionObj){
                return subscriptionObj && subscriptionObj.expiryDate && subscriptionObj.expiryDate > Date.now();
            }

            function _baseIsEntityAvail(){
                return $q.all([getUserPurchaseData(),getFreeContentData()]).then(function(res){
                    var purchaseData = res[0];
                    var hasSubscription = _hasSubscription(purchaseData.subscription);
                    if(hasSubscription){
                        return true;
                    }else{
                        return res;
                    }
                });
            }

            function _isExamPurchased(purchaseData,examId){
                var examKeyProp = idToKeyInStorage(examId);
                return !!(purchaseData.exam === PURCHASED_ALL  || purchaseData.exam[examKeyProp]);
            }

            function _isFreeContent(freeContentData,pathArr){
                var fullPath = pathArr.join('.');
                var isFreeGetter = $parse(fullPath);
                return !!isFreeGetter(freeContentData);
            }

            this.hasSubscription = function(){
                return getUserPurchaseData().then(function(purchaseData){
                    return _hasSubscription(purchaseData.subscription);
                });
            };

            this.isDailyAvail = function(dailyOrder){
                return _baseIsEntityAvail().then(function(res){
                    if(res === true){
                        return true;
                    }

                    var purchaseData = res[0];
                    var freeContent = res[1];

                    if(freeContent.daily >= dailyOrder){
                        return true;
                    }

                    if(angular.isString(purchaseData.daily)){
                        return purchaseData.daily === PURCHASED_ALL;
                    }else{
                        var maxAvailDailyOrder = (purchaseData.daily || 0) + (freeContent.daily || 0);
                        return dailyOrder <= maxAvailDailyOrder;
                    }
                });
            };

            this.isExamAvail = function(examId){
                return _baseIsEntityAvail().then(function(res){
                    if(res === true){
                        return true;
                    }

                    var purchaseData = res[0];
                    var freeContent = res[1];

                    var isPurchased = _isExamPurchased(purchaseData,examId);
                    if(isPurchased){
                        return true;
                    }

                    return _isFreeContent(freeContent,['exam',idToKeyInStorage(examId)]);
                });
            };

            this.isSectionAvail = function(examId,sectionId){
                return _baseIsEntityAvail().then(function(res){
                    if(res === true){
                        return true;
                    }

                    var purchaseData = res[0];
                    var freeContent = res[1];

                    var examKeyProp = idToKeyInStorage(examId);
                    var sectionKeyProp = idToKeyInStorage(sectionId);

                    var isExamPurchased = _isExamPurchased(purchaseData,examId);
                    if(isExamPurchased ){
                        return true;
                    }

                    return _isFreeContent(freeContent,['exam',examKeyProp,'sections',sectionKeyProp]);
                });
            };
        }
    ]);
})(angular);
