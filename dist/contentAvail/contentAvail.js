(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail', ['znk.infra.config']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail').provider('ContentAvailSrv', [
        function () {

            var _specials;

            this.setSpecials = function (specialsObj) {
                _specials = specialsObj;
            };

            this.$get = ["$q", "$parse", "$injector", "InfraConfigSrv", "StorageSrv", function ($q, $parse, $injector, InfraConfigSrv, StorageSrv) {
                'ngInject';

                var PURCHASED_ALL = 'all';

                var ContentAvailSrvObj = {};

                function getUserPurchaseData() {
                    var StorageService = InfraConfigSrv.getStorageService();
                    var purchaseDataPath = StorageSrv.variables.appUserSpacePath + '/purchase';
                    var defValues = {
                        daily: 0,
                        exam: {},
                        tutorial: {},
                        section: {},
                        subscription: {}
                    };
                    return StorageService.get(purchaseDataPath, defValues);
                }

                function getFreeContentData() {
                    var StorageService = InfraConfigSrv.getStorageService();
                    var freeContentPath = 'freeContent';
                    var defValues = {
                        daily: 0,
                        exam: {},
                        tutorial: {},
                        section: {},
                        specials: {}
                    };
                    return StorageService.get(freeContentPath, defValues);
                }

                function getUserSpecialsData() {
                    var specialsProm = false;
                    if (_specials) {
                        specialsProm = $injector.invoke(_specials);
                    }
                    return $q.when(specialsProm);
                }

                function idToKeyInStorage(id) {
                    return 'id_' + id;
                }

                function _hasSubscription(subscriptionObj) {
                    return subscriptionObj && subscriptionObj.expiryDate && subscriptionObj.expiryDate > Date.now();
                }

                function _baseIsEntityAvail() {
                    return $q.all([getUserPurchaseData(), getFreeContentData(), getUserSpecialsData()]).then(function (res) {
                        var purchaseData = res[0];
                        var hasSubscription = _hasSubscription(purchaseData.subscription);
                        var earnedSpecialsObj = {
                            daily: 0,
                            exam: {},
                            section: {},
                            tutorial: {}
                        };
                        if (hasSubscription) {
                            return true;
                        } else {
                            var specials = res[1].specials;
                            var specialsRes = res[2];
                            if (specialsRes) {
                                angular.forEach(specialsRes, function (specialVal, specialKey) {
                                    if (specials[specialKey] && specialVal === true) {
                                        angular.forEach(specials[specialKey], function (val, key) {
                                            if (val === PURCHASED_ALL) {
                                                earnedSpecialsObj[key] = val;
                                            } else {
                                                switch (key) {
                                                    case 'daily':
                                                        if (angular.isNumber(val)) {
                                                            earnedSpecialsObj.daily += val;
                                                        }
                                                        break;
                                                    case 'exam':
                                                        if (angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.exam = angular.extend(earnedSpecialsObj.exam, val);
                                                        }
                                                        break;
                                                    case 'section':
                                                        if (angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.section = angular.extend(earnedSpecialsObj.section, val);
                                                        }
                                                        break;
                                                    case 'tutorial':
                                                        if (angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.tutorial = angular.extend(earnedSpecialsObj.tutorial, val);
                                                        }
                                                        break;
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            res.push(earnedSpecialsObj);
                            return res;
                        }
                    });
                }

                function _isContentOwned(contentData, pathArr) {
                    var prefixPathArr = pathArr.slice(0, pathArr.length - 1);
                    var prefixPath = prefixPathArr.join('.');
                    var isAllOwned = $parse(prefixPath)(contentData) === PURCHASED_ALL;
                    if (isAllOwned) {
                        return true;
                    }

                    var fullPath = pathArr.join('.');
                    return $parse(fullPath)(contentData);
                }

                ContentAvailSrvObj.hasSubscription = function hasSubscription() {
                    return getUserPurchaseData().then(function (purchaseData) {
                        return _hasSubscription(purchaseData.subscription);
                    });
                };

                ContentAvailSrvObj.isDailyAvail = function isDailyAvail(dailyOrder) {
                    if (!angular.isNumber(dailyOrder) || isNaN(dailyOrder)) {
                        return $q.reject('daily order should be a number');
                    }
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var isAllOwned = purchaseData.daily === PURCHASED_ALL || freeContent.daily === PURCHASED_ALL || earnedSpecials.daily === PURCHASED_ALL;
                        if (isAllOwned) {
                            return true;
                        }

                        var maxAvailDailyOrder = (purchaseData.daily || 0) + (freeContent.daily || 0) + (earnedSpecials.daily || 0);
                        return dailyOrder <= maxAvailDailyOrder;
                    });
                };

                ContentAvailSrvObj.isExamAvail = function isExamAvail(examId) {
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examPathArr = ['exam', idToKeyInStorage(examId)];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent, examPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials, examPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData, examPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                };

                ContentAvailSrvObj.isSectionAvail = function isSectionAvail(examId, sectionId) {
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examKeyProp = idToKeyInStorage(examId);
                        var examPathArr = ['exam', examKeyProp];
                        var isExamPurchased = _isContentOwned(purchaseData, examPathArr);
                        if (isExamPurchased) {
                            return true;
                        }

                        var sectionKeyProp = idToKeyInStorage(sectionId);

                        var sectionPathArr = ['section', sectionKeyProp];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent, sectionPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials, sectionPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData, sectionPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                };

                ContentAvailSrvObj.isTutorialAvail = function isTutorialAvail(tutorialId) {
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var tutorialKeyInStorage = idToKeyInStorage(tutorialId);

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];
                        var tutorialPathArr = ['tutorial', tutorialKeyInStorage];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent, tutorialPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials, tutorialPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData, tutorialPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;

                    });
                };

                ContentAvailSrvObj.getFreeContentDailyNum = function getFreeContentDailyNum() {
                    return getFreeContentData().then(function (freeContentData) {
                        return freeContentData.daily;
                    });
                };
                // api
                return ContentAvailSrvObj;
            }];
        }
    ]);
})(angular);

angular.module('znk.infra.contentAvail').run(['$templateCache', function($templateCache) {

}]);
