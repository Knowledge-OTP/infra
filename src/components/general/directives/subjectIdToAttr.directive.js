/**
 *  @directive subjectIdToAttrDrv
 *  This directive is an evolution of 'subjectIdToClassDrv'
 *  @context-attr a comma separated string of attribute names
 *  @prefix a comma separated string of prefixes to the attribute values
 *  @suffix a comma separated string of suffixes to the attribute values
 *
 *  In case only one prefix/suffix is provided, it will be used in all attributes
 *  In case no @context-attr is provided, it will set the class attribute by default
 *  No need to pass dashes ('-') to prefix or suffix, they are already appended
 *
 * ** Optional **: you can now add an attribute called "type" and assign it the word topic if you want idToTopicName
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToAttrDrv',
        function (SubjectEnum, $interpolate, LiveSessionSubjectEnum) {
            'ngInject';
            return {
                link: {
                    pre: function (scope, element, attrs) {
                        var addedClassesArr = [];

                        scope.$watch(attrs.subjectIdToAttrDrv, function (id) {
                            var contextAttr = attrs.contextAttr ? $interpolate(attrs.contextAttr)(scope) : undefined;
                            var prefix = attrs.prefix ? $interpolate(attrs.prefix)(scope) : undefined;
                            var suffix = attrs.suffix ? $interpolate(attrs.suffix)(scope) : undefined;

                            if (angular.isUndefined(id)) {
                                return;
                            }

                            var attrsArray;
                            if (contextAttr) {
                                attrsArray = contextAttr.split(',');
                            } else {
                                attrsArray = [];
                                attrsArray.push('class');
                            }

                            var attrPrefixes = (prefix) ? prefix.split(',') : [];
                            var attrSuffixes = (suffix) ? suffix.split(',') : [];

                            var topicEnumMap = LiveSessionSubjectEnum.getEnumMap();
                            var topicNameToAdd = topicEnumMap[id];

                            var subjectEnumMap = SubjectEnum.getEnumMap();
                            var subjectNameToAdd = subjectEnumMap[id];

                            angular.forEach(attrsArray, function (value, key) {
                                var attrVal;
                                if (attrs.type === 'topic') {
                                    attrVal = topicNameToAdd + '-' + attrs.type;
                                } else {
                                    attrVal = subjectNameToAdd;
                                }

                                if (attrPrefixes.length) {
                                    var prefix = attrPrefixes[key] || attrPrefixes[0];
                                    if (prefix !== '') {
                                        attrVal = prefix + '-' + attrVal;
                                    }
                                }

                                if (attrSuffixes.length) {
                                    var suffix = attrSuffixes[key] || attrSuffixes[0];
                                    if (suffix !== '') {
                                        attrVal += '-' + suffix;
                                    }
                                }

                                attrVal = attrVal.replace(/\s+/g, ''); // regex to clear spaces
                                value = value.replace(/\s+/g, ''); // regex to clear spaces

                                if (value === 'class') {
                                    if (!element.hasClass(attrVal)) {
                                        addedClassesArr.forEach(function (clsToRemove) {
                                            if (clsToRemove.indexOf(subjectNameToAdd) === -1) {
                                                element.removeClass(clsToRemove);
                                            }
                                        });
                                        addedClassesArr.push(attrVal);
                                        element.addClass(attrVal);
                                    }
                                } else {
                                    element.attr(value, attrVal);
                                }
                            });

                        });
                    }
                }
            };
        });
})(angular);
