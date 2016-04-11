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
                        section: {},
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
                        section: {},
                        specials: {}
                    };
                    return StorageService.get(freeContentPath,defValues);
                }

                function getUserSpecialsData(){
                    var specialsProm = $injector.invoke(_specials);
                    return $q.when(specialsProm);
                }

                function idToKeyInStorage(id){
                    return 'id_' + id;
                }

                function _hasSubscription(subscriptionObj){
                    return subscriptionObj && subscriptionObj.expiryDate && subscriptionObj.expiryDate > Date.now();
                }

                function _baseIsEntityAvail(){
                    return $q.all([getUserPurchaseData(),getFreeContentData(), getUserSpecialsData()]).then(function(res){
                        var purchaseData = res[0];
                        var hasSubscription = _hasSubscription(purchaseData.subscription);
                        if(hasSubscription){
                            return true;
                        }else{
                            if(!_specials) {
                                return res;
                            }
                            var specials = res[1].specials;
                            var specialsRes = res[2];
                            var earnedSpecialsObj = {
                                daily: 0,
                                exam: {},
                                section: {},
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
                                            case 'section':
                                                earnedSpecialsObj.section = angular.extend(earnedSpecialsObj.section, val);
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
                        }
                    });
                }

                function _isContentOwned(contentData,pathArr){
                    var prefixPathArr = pathArr.slice(0, pathArr.length - 1);
                    var prefixPath = prefixPathArr.join('.');
                    var isAllOwned = $parse(prefixPath)(contentData) === PURCHASED_ALL;
                    if(isAllOwned){
                        return true;
                    }

                    var fullPath = pathArr.join('.');
                    return $parse(fullPath)(contentData);
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
                        var earnedSpecials = res[3];

                        var isAllOwned = purchaseData.daily === PURCHASED_ALL || freeContent.daily === PURCHASED_ALL || earnedSpecials.daily === PURCHASED_ALL;
                        if(isAllOwned){
                            return true;
                        }

                        var maxAvailDailyOrder = (purchaseData.daily || 0) + (freeContent.daily || 0) + (earnedSpecials.daily || 0);
                        return dailyOrder <= maxAvailDailyOrder;
                    });
                }

                function isExamAvail(examId){
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examPathArr = ['exam',idToKeyInStorage(examId)];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent,examPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials,examPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData,examPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                }

                function isSectionAvail(examId,sectionId){
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examKeyProp = idToKeyInStorage(examId);
                        var examPathArr = ['exam',examKeyProp];
                        var isExamPurchased = _isContentOwned(purchaseData,examPathArr);
                        if(isExamPurchased ){
                            return true;
                        }

                        var sectionKeyProp = idToKeyInStorage(sectionId);

                        var sectionPathArr = ['section',sectionKeyProp];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent,sectionPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials,sectionPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData,sectionPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                }

                function isTutorialAvail(tutorialId){
                    return _baseIsEntityAvail().then(function(res) {
                        if (res === true) {
                            return true;
                        }

                        var tutorialKeyInStorage = idToKeyInStorage(tutorialId);

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];
                        var tutorialPathArr = ['tutorial',tutorialKeyInStorage];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent,tutorialPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials,tutorialPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData,tutorialPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;

                    });
                }

                // api
                return {
                    hasSubscription: hasSubscription,
                    isDailyAvail: isDailyAvail,
                    isExamAvail: isExamAvail,
                    isSectionAvail: isSectionAvail,
                    isTutorialAvail: isTutorialAvail
                };
            }];
        }
    ]);
})(angular);
