(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail').provider('ContentAvailSrv', [
        function () {

            var _specials;

            this.setSpecials = function(specialsObj) {
                _specials = specialsObj;
            };

            this.$get = ['$q', '$parse', '$injector', 'InfraConfigSrv', function($q, $parse, $injector, InfraConfigSrv) {

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
                        tutorial: {},
                        specials: {}
                    };
                    return StorageService.get(freeContentPath,defValues);
                }

                function getUserSpecialsData(){
                    var specialsProms = {};
                    angular.forEach(_specials, function(specialFn, key) {
                        specialsProms[key] = $injector.invoke(specialFn);
                    });
                    return $q.all(specialsProms);
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
                            if(!_specials) {
                                return res;
                            }
                            return getUserSpecialsData().then(function(specialsRes) {
                                var specials = res[1].specials;
                                var earnedSpecialsObj = {
                                    daily: 0,
                                    exam: {},
                                    tutorial: {}
                                };
                                angular.forEach(specialsRes, function(specialVal, specialKey) {
                                    if(specials[specialKey] && specialVal === true) {
                                        angular.forEach(specials[specialKey], function(val, key) {
                                            switch(key) {
                                                case 'daily':
                                                    earnedSpecialsObj.daily += val;
                                                break;
                                                case 'exam':
                                                    earnedSpecialsObj.exam = angular.extend(earnedSpecialsObj.exam, val);
                                                break;
                                                case 'tutorial':
                                                    earnedSpecialsObj.tutorial = angular.extend(earnedSpecialsObj.tutorial, val);
                                                break;
                                            }
                                        });
                                    }
                                });
                                res.push(earnedSpecialsObj);
                                return res;
                            });
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

                function hasSubscription() {
                    return getUserPurchaseData().then(function(purchaseData){
                        return _hasSubscription(purchaseData.subscription);
                    });
                }

                function isDailyAvail(dailyOrder){
                    if(!angular.isNumber(dailyOrder) || isNaN(dailyOrder)){
                        return $q.reject('daily order should be a number');
                    }
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var specials = res[2];

                        if((specials.daily + freeContent.daily) >= dailyOrder){
                            return true;
                        }

                        if(angular.isString(purchaseData.daily)){
                            return purchaseData.daily === PURCHASED_ALL;
                        }else{
                            var maxAvailDailyOrder = (purchaseData.daily || 0) + (freeContent.daily || 0);
                            return dailyOrder <= maxAvailDailyOrder;
                        }
                    });
                }

                function isExamAvail(examId){
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var specials = res[2];

                        var isPurchased = _isExamPurchased(purchaseData,examId);
                        if(isPurchased){
                            return true;
                        }

                        var resultsFreeContent = _isFreeContent(freeContent,['exam',idToKeyInStorage(examId)]);

                        if(specials.exam) {
                           return (resultsFreeContent || _isFreeContent(specials,['exam',idToKeyInStorage(examId)]));
                        }

                        return resultsFreeContent;
                    });
                }

                 function isSectionAvail(examId,sectionId){
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var specials = res[2];

                        var examKeyProp = idToKeyInStorage(examId);
                        var sectionKeyProp = idToKeyInStorage(sectionId);

                        var isExamPurchased = _isExamPurchased(purchaseData,examId);
                        if(isExamPurchased ){
                            return true;
                        }

                        var resultsFreeContent = _isFreeContent(freeContent,['exam',examKeyProp,'sections',sectionKeyProp]);

                        if(specials.exam) {
                            return (resultsFreeContent || _isFreeContent(specials,['exam',examKeyProp,'sections',sectionKeyProp]));
                        }

                        return resultsFreeContent;
                    });
                }

                 function isTutorialAvail(tutorialId){
                    if(isNaN(tutorialId)){
                        return $q.reject('ContentAvailSrv: tutorial id should be a number');
                    }

                    return _baseIsEntityAvail().then(function(res) {
                        if (res === true) {
                            return true;
                        }

                        var tutorialKeyInStorage = idToKeyInStorage(tutorialId);

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var specials = res[2];

                        if(freeContent.tutorial[tutorialKeyInStorage] || specials.tutorial[tutorialKeyInStorage]){
                            return true;
                        }

                        return !!(purchaseData.tutorial === PURCHASED_ALL || purchaseData.tutorial[tutorialKeyInStorage]);

                    });
                }

                // api
                return {
                    hasSubscription: hasSubscription,
                    isDailyAvail: isDailyAvail,
                    isExamAvail: isExamAvail,
                    isSectionAvail: isSectionAvail,
                    isTutorialAvail: isTutorialAvail
                }
            }];
        }
    ]);
})(angular);
