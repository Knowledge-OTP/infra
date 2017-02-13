(function (angular) {
    'use strict';

    var mockCategoriesServiceName = 'categories';

    angular.module('categories.mock', [])
        .constant(mockCategoriesServiceName, [{
    "id": 9,
    "name": "Math Level 1",
    "shortName": "M1",
    "parentId": null,
    "typeId": 9,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 10,
    "name": "Math Level 2",
    "shortName": "M2",
    "parentId": null,
    "typeId": 9,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 11,
    "name": "Algebra and Functions",
    "shortName": "AF1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 12,
    "name": "Advanced Topics",
    "shortName": "AT1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 13,
    "name": "Data Analysis and Statistics",
    "shortName": "DS1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 14,
    "name": "Geometry and Measurement",
    "shortName": "GM1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 15,
    "name": "Numbers and Operations",
    "shortName": "NO1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 16,
    "name": "Trigonometry",
    "shortName": "TR1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 17,
    "name": "Algebra and Functions",
    "shortName": "AF2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 18,
    "name": "Advanced Topics",
    "shortName": "AT2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 19,
    "name": "Data Analysis and Statistics",
    "shortName": "DS2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 20,
    "name": "Geometry and Measurement",
    "shortName": "GM2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 21,
    "name": "Numbers and Operations",
    "shortName": "NO2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 22,
    "name": "Trigonometry",
    "shortName": "TR2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 23,
    "name": "Exponential Growth and Decay",
    "shortName": "EXGD1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 24,
    "name": "Function Composition",
    "shortName": "FCMP1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 25,
    "name": "Function Domain, Range, and Asymptotes",
    "shortName": "FDAR1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 26,
    "name": "Function Evaluation and Symbol Functions",
    "shortName": "FEVA1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 27,
    "name": "Function Inverses",
    "shortName": "FINV1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 28,
    "name": "Linear Functions",
    "shortName": "FLIN1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 29,
    "name": "Polynomial Functions",
    "shortName": "FPLY1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 30,
    "name": "Qualitative Features of Functions",
    "shortName": "FQLT1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 31,
    "name": "Inequalities and Absolute Value Inequalities",
    "shortName": "INEQ1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 32,
    "name": "Quadratic Functions and Factoring",
    "shortName": "QUAD1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 33,
    "name": "Slopes, Parallel, and Perpendicular",
    "shortName": "SLPS1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 34,
    "name": "Solving Equations",
    "shortName": "SOLV1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 35,
    "name": "Systems of Equations",
    "shortName": "SYSE1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 36,
    "name": "Transformation of Functions and Graphs",
    "shortName": "TRNS1",
    "parentId": 11,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 37,
    "name": "Complex Numbers",
    "shortName": "CPLX1",
    "parentId": 12,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 38,
    "name": "Logarithms",
    "shortName": "LOGS1",
    "parentId": 12,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 39,
    "name": "Data Analysis",
    "shortName": "DATA1",
    "parentId": 13,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 40,
    "name": "Angles in the Plane and in Polygons",
    "shortName": "ANGL1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 41,
    "name": "Coordinate Geometry with Circles",
    "shortName": "CCIR1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 42,
    "name": "Circles",
    "shortName": "CIRC1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 43,
    "name": "Coordinate Geometry",
    "shortName": "COOR1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 44,
    "name": "Quadrilaterals",
    "shortName": "QDLT1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 45,
    "name": "Similar Triangles",
    "shortName": "SIMT1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 46,
    "name": "Solid Geometry",
    "shortName": "SLID1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 47,
    "name": "Triangles",
    "shortName": "TRIS1",
    "parentId": 14,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 48,
    "name": "Average",
    "shortName": "AVGS1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 49,
    "name": "Counting",
    "shortName": "CNTG1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 50,
    "name": "English to Math",
    "shortName": "ETOM1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 51,
    "name": "Expression Manipulation",
    "shortName": "EXPM1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 52,
    "name": "Exponents",
    "shortName": "EXPO1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 53,
    "name": "Integer and Number Properties",
    "shortName": "INTP1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 54,
    "name": "Logical Reasoning",
    "shortName": "LOGR1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 55,
    "name": "Percents, Fractions and Probabillity",
    "shortName": "PERC1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 56,
    "name": "Ratio and Proportions",
    "shortName": "RATE1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 57,
    "name": "Sequences and Series",
    "shortName": "SEQS1",
    "parentId": 15,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 58,
    "name": "Right Triangle Trigonometry and Equivalent Expressions",
    "shortName": "TRIG1",
    "parentId": 16,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 59,
    "name": "Exponential Growth and Decay",
    "shortName": "EXGD2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 60,
    "name": "Function Composition",
    "shortName": "FCMP2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 61,
    "name": "Function Domain, Range and Asymptotes",
    "shortName": "FDAR2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 62,
    "name": "Function Evaluation and Symbol Functions",
    "shortName": "FEVA2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 1,
    "subScore2Id": null
}, {
    "id": 63,
    "name": "Function Inverses",
    "shortName": "FINV2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 64,
    "name": "Linear Functions",
    "shortName": "FLIN2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 65,
    "name": "Polynomial Functions",
    "shortName": "FPLY2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 66,
    "name": "Qualitative Features of Functions",
    "shortName": "FQLT2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 67,
    "name": "Inequalities and Absolute Value Inequalities",
    "shortName": "INEQ2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 68,
    "name": "Quadratic Functions and Factoring",
    "shortName": "QUAD2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 69,
    "name": "Slopes, Parallel, and Perpendicular",
    "shortName": "SLPS2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 70,
    "name": "Solving Equations",
    "shortName": "SOLV2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 2,
    "subScore2Id": null
}, {
    "id": 71,
    "name": "Systems of Equations",
    "shortName": "SYSE2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 0,
    "subScore2Id": null
}, {
    "id": 72,
    "name": "Transformation of Functions and Graphs",
    "shortName": "TRNS2",
    "parentId": 17,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 73,
    "name": "Complex Numbers",
    "shortName": "CPLX2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 74,
    "name": "Logarithms",
    "shortName": "LOGS2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 75,
    "name": "Matrices",
    "shortName": "MTRX2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 76,
    "name": "Vectors",
    "shortName": "VECT2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": null
}, {
    "id": 77,
    "name": "Parametric Equations",
    "shortName": "PARM2",
    "parentId": 18,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 78,
    "name": "Statistics and Standard Deviation",
    "shortName": "STAT2",
    "parentId": 19,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 79,
    "name": "Angles in the Plane and in Polygons",
    "shortName": "ANGL2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 80,
    "name": "Circles",
    "shortName": "CIRC2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 81,
    "name": "Conics",
    "shortName": "CNCS2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 82,
    "name": "Coordinate Geometry",
    "shortName": "COOR2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 83,
    "name": "Quadrilaterals",
    "shortName": "QDLT2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": null
}, {
    "id": 84,
    "name": "Solid Geometry",
    "shortName": "SLID2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": null
}, {
    "id": 85,
    "name": "Triangles",
    "shortName": "TRIS2",
    "parentId": 20,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": null
}, {
    "id": 86,
    "name": "Averages",
    "shortName": "AVGS2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 87,
    "name": "Counting",
    "shortName": "CNTG2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 88,
    "name": "English to Math",
    "shortName": "ETOM2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 89,
    "name": "Expression Manipulation",
    "shortName": "EXPM2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 90,
    "name": "Exponents",
    "shortName": "EXPO2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 91,
    "name": "Integer and Number Properties",
    "shortName": "INTP2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 92,
    "name": "Logical Reasoning",
    "shortName": "LOGR2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": null
}, {
    "id": 93,
    "name": "Percents, Fractions, and Probabillity",
    "shortName": "PERC2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 94,
    "name": "Ratio and Proportions",
    "shortName": "RATE2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 95,
    "name": "Sequences and Series",
    "shortName": "SEQS2",
    "parentId": 21,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 96,
    "name": "Trigonometry - Graphing",
    "shortName": "TRGG2",
    "parentId": 22,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 6,
    "subScore2Id": 3
}, {
    "id": 97,
    "name": "Trigonometry - Right Triangle and Equivalent Expressions",
    "shortName": "TRIG2",
    "parentId": 22,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 98,
    "name": "Trigonometry - Unit Circle",
    "shortName": "TRUC2",
    "parentId": 22,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 99,
    "name": "General Test Information",
    "shortName": "TESTG1",
    "parentId": 9,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 100,
    "name": "General Test Information",
    "shortName": "TESTG2",
    "parentId": 10,
    "typeId": 6,
    "instruction": null,
    "weight": null,
    "subScore1Id": 5,
    "subScore2Id": 4
}, {
    "id": 101,
    "name": "General Test Information",
    "shortName": "TESTS1",
    "parentId": 99,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": 3
}, {
    "id": 102,
    "name": "General Test Information",
    "shortName": "TESTS2",
    "parentId": 100,
    "typeId": 7,
    "instruction": null,
    "weight": null,
    "subScore1Id": null,
    "subScore2Id": 3
}]);
})(angular);
