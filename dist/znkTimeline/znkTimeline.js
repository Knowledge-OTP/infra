(function (angular) {
    'use strict';
    angular.module('znk.infra.znkTimeline', ['znk.infra.svgIcon', 'znk.infra.enum']);
})(angular);

angular.module('znk.infra.znkTimeline').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\" class=\"timeline-diagnostic-test-icon\" width=\"30px\" height=\"30px\">\n" +
    "	 <style type=\"text/css\">\n" +
    "     	.timeline-diagnostic-test-icon .st0{fill:#fff;}\n" +
    "     </style>\n" +
    "<g id=\"kUxrE9.tif\">\n" +
    "	<g>\n" +
    "		<path class=\"st0\" id=\"XMLID_93_\" d=\"M-140.1,287c0.6-1.1,1.7-1.7,2.9-1.4c1.3,0.3,2,1.1,2.3,2.3c1.1,4,2.1,8,3.2,12c2.4,9.3,4.9,18.5,7.3,27.8\n" +
    "			c0.1,0.3,0.2,0.6,0.2,0.9c0.3,1.7-0.6,3-2.1,3.3c-1.4,0.3-2.8-0.5-3.3-2.1c-1-3.6-2-7.3-2.9-10.9c-2.5-9.5-5-19-7.6-28.6\n" +
    "			C-140.1,290-140.8,288.3-140.1,287z\"/>\n" +
    "		<path class=\"st0\" id=\"XMLID_92_\" d=\"M-89.6,289.1c-1,6.8-2.9,13-10,16c-3.2,1.4-6.5,1.6-9.9,0.9c-2-0.4-4-0.7-6-0.6c-4.2,0.3-7.1,2.7-9,6.4\n" +
    "			c-0.3,0.5-0.5,1.1-0.9,2c-0.3-1-0.5-1.7-0.8-2.5c-2-7-3.9-14.1-5.9-21.2c-0.3-1-0.1-1.7,0.5-2.4c4.5-6,11-7.4,17.5-3.6\n" +
    "			c3.4,2,6.7,4.2,10.2,6.1c1.9,1,3.9,1.9,5.9,2.4c3.2,0.9,5.9,0,7.9-2.6C-90,289.7-89.8,289.4-89.6,289.1z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-drills-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\" class=\"timeline-drills-icon\" width=\"30px\" height=\"30px\">\n" +
    "<style type=\"text/css\">\n" +
    "    .timeline-drills-icon .all > * { fill: #fff; }\n" +
    "	.timeline-drills-icon .st0{clip-path:url(#SVGID_2_);}\n" +
    "	.timeline-drills-icon .st1{clip-path:url(#SVGID_4_);}\n" +
    "</style>\n" +
    "<g id=\"XMLID_93_\" class=\"all\">\n" +
    "	<path id=\"XMLID_105_\" d=\"M-105.3,308.4h-18.6c-0.6,0-1-0.4-1-1c0-0.6,0.4-1,1-1h18.6c0.6,0,1,0.4,1,1S-104.8,308.4-105.3,308.4z\"/>\n" +
    "	<g id=\"XMLID_100_\">\n" +
    "		<path id=\"XMLID_104_\" d=\"M-128.2,317.9c-1.1,0-2-0.9-2-2v-17.8c0-1.1,0.9-2,2-2c1.1,0,2,0.9,2,2v17.8\n" +
    "			C-126.2,317-127.1,317.9-128.2,317.9z\"/>\n" +
    "		<path id=\"XMLID_103_\" d=\"M-132.7,313.7c-0.7,0-1.2-0.6-1.2-1.2v-10.8c0-0.7,0.6-1.2,1.2-1.2c0.7,0,1.2,0.6,1.2,1.2v10.8\n" +
    "			C-131.5,313.1-132,313.7-132.7,313.7z\"/>\n" +
    "		<g id=\"XMLID_101_\">\n" +
    "			<g>\n" +
    "				<g>\n" +
    "					<g>\n" +
    "						<defs>\n" +
    "							<rect id=\"SVGID_1_\" x=\"-140\" y=\"305.6\" width=\"4.3\" height=\"4.3\"/>\n" +
    "						</defs>\n" +
    "						<clipPath id=\"SVGID_2_\">\n" +
    "							<use xlink:href=\"#SVGID_1_\"  style=\"overflow:visible;\"/>\n" +
    "						</clipPath>\n" +
    "						<path id=\"XMLID_99_\" class=\"st0\" d=\"M-134,308.9h-1.5c-0.8,0-1.4-0.6-1.4-1.4c0-0.8,0.6-1.4,1.4-1.4h1.5\n" +
    "							c0.8,0,1.4,0.6,1.4,1.4C-132.6,308.3-133.2,308.9-134,308.9z\"/>\n" +
    "					</g>\n" +
    "				</g>\n" +
    "			</g>\n" +
    "		</g>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_94_\">\n" +
    "		<path id=\"XMLID_98_\" d=\"M-101.3,317.9c-1.1,0-2-0.9-2-2v-17.8c0-1.1,0.9-2,2-2s2,0.9,2,2v17.8C-99.3,317-100.2,317.9-101.3,317.9z\n" +
    "			\"/>\n" +
    "		<path id=\"XMLID_97_\" d=\"M-96.8,313.7c-0.7,0-1.2-0.6-1.2-1.2v-10.8c0-0.7,0.6-1.2,1.2-1.2c0.7,0,1.2,0.6,1.2,1.2v10.8\n" +
    "			C-95.5,313.1-96.1,313.7-96.8,313.7z\"/>\n" +
    "		<g id=\"XMLID_95_\">\n" +
    "			<g>\n" +
    "				<g>\n" +
    "					<g>\n" +
    "						<defs>\n" +
    "							<rect id=\"SVGID_3_\" x=\"-94.3\" y=\"305.6\" width=\"4.3\" height=\"4.3\"/>\n" +
    "						</defs>\n" +
    "						<clipPath id=\"SVGID_4_\">\n" +
    "							<use xlink:href=\"#SVGID_3_\"  style=\"overflow:visible;\"/>\n" +
    "						</clipPath>\n" +
    "						<path id=\"XMLID_107_\" class=\"st1\" d=\"M-94,308.9h-1.5c-0.8,0-1.4-0.6-1.4-1.4c0-0.8,0.6-1.4,1.4-1.4h1.5\n" +
    "							c0.8,0,1.4,0.6,1.4,1.4C-92.7,308.3-93.3,308.9-94,308.9z\"/>\n" +
    "					</g>\n" +
    "				</g>\n" +
    "			</g>\n" +
    "		</g>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-105 277 60 60\" style=\"enable-background:new -105 277 60 60;\" xml:space=\"preserve\" class=\"timeline-mini-challenge-icon\" width=\"30px\" height=\"30px\">\n" +
    "	 	 <style type=\"text/css\">\n" +
    "          	.timeline-mini-challenge-icon .st0{fill:#fff;}\n" +
    "          </style>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-75,332c-11.5,0-21-9.4-21-21c0-11.5,9.4-21,21-21s21,9.4,21,21S-63.5,332-75,332z M-75,292.7c-10.1,0-18.4,8.2-18.4,18.4\n" +
    "		s8.2,18.4,18.4,18.4s18.4-8.2,18.4-18.4S-64.9,292.7-75,292.7z\"/>\n" +
    "	<circle class=\"st0\" cx=\"-74.8\" cy=\"312\" r=\"2.3\"/>\n" +
    "	<path class=\"st0\" d=\"M-74.1,308.1h-1c-0.2,0-0.4-0.1-0.4-0.2v-10.6c0-0.1,0.2-0.2,0.4-0.2h1c0.2,0,0.4,0.1,0.4,0.2v10.6\n" +
    "		C-73.7,307.9-73.9,308.1-74.1,308.1z\"/>\n" +
    "	<path class=\"st0\" d=\"M-71,310.8l-0.6-1c-0.1-0.2-0.1-0.4,0-0.5l4.4-2.6c0.1-0.1,0.4,0,0.5,0.2l0.6,1c0.1,0.2,0.1,0.4,0,0.5l-4.4,2.6\n" +
    "		C-70.6,311.1-70.8,311-71,310.8z\"/>\n" +
    "	<path class=\"st0\" d=\"M-76.9,285.8v1.8c0,1.2,0.9,2.1,2.1,2.1c1.2,0,2.1-0.9,2.1-2.1v-1.8H-76.9z\"/>\n" +
    "	<path class=\"st0\" d=\"M-68.5,283.2c0,0.7-0.5,1.2-1.2,1.2h-9.7c-0.7,0-1.2-0.5-1.2-1.2l0,0c0-0.7,0.5-1.2,1.2-1.2h9.7\n" +
    "		C-69,282-68.5,282.5-68.5,283.2L-68.5,283.2z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-test-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-111 277 60 60\" style=\"enable-background:new -111 277 60 60;\" xml:space=\"preserve\" class=\"timeline-test-icon\" width=\"30px\" height=\"30px\">\n" +
    "<style type=\"text/css\">\n" +
    "	.timeline-test-icon .st0{fill:#fff;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-62.9,332h-36.2c-1.5,0-2.8-1.2-2.8-2.8v-44.5c0-1.5,1.2-2.8,2.8-2.8h36.2c1.5,0,2.8,1.2,2.8,2.8v44.5\n" +
    "		C-60.1,330.8-61.4,332-62.9,332z M-99.1,283.6c-0.6,0-1.2,0.5-1.2,1.2v44.5c0,0.6,0.5,1.2,1.2,1.2h36.2c0.6,0,1.2-0.5,1.2-1.2\n" +
    "		v-44.5c0-0.6-0.5-1.2-1.2-1.2H-99.1L-99.1,283.6z\"/>\n" +
    "	<g id=\"XMLID_312_\">\n" +
    "		<circle id=\"XMLID_199_\" class=\"st0\" cx=\"-95\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_198_\" class=\"st0\" cx=\"-92.5\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_197_\" class=\"st0\" cx=\"-89.9\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_196_\" class=\"st0\" cx=\"-95\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_195_\" class=\"st0\" cx=\"-92.5\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_194_\" class=\"st0\" cx=\"-90\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_193_\" class=\"st0\" cx=\"-95\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_192_\" class=\"st0\" cx=\"-92.5\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_191_\" class=\"st0\" cx=\"-89.9\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_302_\">\n" +
    "		<circle id=\"XMLID_190_\" class=\"st0\" cx=\"-83.6\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_189_\" class=\"st0\" cx=\"-81.1\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_188_\" class=\"st0\" cx=\"-78.6\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_187_\" class=\"st0\" cx=\"-83.7\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_186_\" class=\"st0\" cx=\"-81.1\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_185_\" class=\"st0\" cx=\"-78.6\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_184_\" class=\"st0\" cx=\"-83.6\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_183_\" class=\"st0\" cx=\"-81.1\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_182_\" class=\"st0\" cx=\"-78.6\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_292_\">\n" +
    "		<circle id=\"XMLID_181_\" class=\"st0\" cx=\"-72.3\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_180_\" class=\"st0\" cx=\"-69.8\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_179_\" class=\"st0\" cx=\"-67.2\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_178_\" class=\"st0\" cx=\"-72.3\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_177_\" class=\"st0\" cx=\"-69.8\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_176_\" class=\"st0\" cx=\"-67.2\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_175_\" class=\"st0\" cx=\"-72.3\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_174_\" class=\"st0\" cx=\"-69.8\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_173_\" class=\"st0\" cx=\"-67.2\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_282_\">\n" +
    "		<circle id=\"XMLID_172_\" class=\"st0\" cx=\"-94.9\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_171_\" class=\"st0\" cx=\"-92.3\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_170_\" class=\"st0\" cx=\"-89.8\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_169_\" class=\"st0\" cx=\"-94.9\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_168_\" class=\"st0\" cx=\"-92.4\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_167_\" class=\"st0\" cx=\"-89.8\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_166_\" class=\"st0\" cx=\"-94.9\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_165_\" class=\"st0\" cx=\"-92.3\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_164_\" class=\"st0\" cx=\"-89.8\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_272_\">\n" +
    "		<circle id=\"XMLID_163_\" class=\"st0\" cx=\"-83.5\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_162_\" class=\"st0\" cx=\"-81\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_161_\" class=\"st0\" cx=\"-78.4\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_160_\" class=\"st0\" cx=\"-83.5\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_159_\" class=\"st0\" cx=\"-81\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_158_\" class=\"st0\" cx=\"-78.5\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_157_\" class=\"st0\" cx=\"-83.5\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_156_\" class=\"st0\" cx=\"-81\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_155_\" class=\"st0\" cx=\"-78.4\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_262_\">\n" +
    "		<circle id=\"XMLID_154_\" class=\"st0\" cx=\"-72.1\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_153_\" class=\"st0\" cx=\"-69.6\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_152_\" class=\"st0\" cx=\"-67.1\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_151_\" class=\"st0\" cx=\"-72.2\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_150_\" class=\"st0\" cx=\"-69.6\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_149_\" class=\"st0\" cx=\"-67.1\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_148_\" class=\"st0\" cx=\"-72.1\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_147_\" class=\"st0\" cx=\"-69.6\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_146_\" class=\"st0\" cx=\"-67.1\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_252_\">\n" +
    "		<circle id=\"XMLID_145_\" class=\"st0\" cx=\"-94.7\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_144_\" class=\"st0\" cx=\"-92.2\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_143_\" class=\"st0\" cx=\"-89.7\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_142_\" class=\"st0\" cx=\"-94.8\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_141_\" class=\"st0\" cx=\"-92.3\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_140_\" class=\"st0\" cx=\"-89.8\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_139_\" class=\"st0\" cx=\"-94.7\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_138_\" class=\"st0\" cx=\"-92.2\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_137_\" class=\"st0\" cx=\"-89.7\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_242_\">\n" +
    "		<circle id=\"XMLID_136_\" class=\"st0\" cx=\"-83.4\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_135_\" class=\"st0\" cx=\"-80.9\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_134_\" class=\"st0\" cx=\"-78.3\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_133_\" class=\"st0\" cx=\"-83.4\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_132_\" class=\"st0\" cx=\"-80.9\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_131_\" class=\"st0\" cx=\"-78.4\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_130_\" class=\"st0\" cx=\"-83.4\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_129_\" class=\"st0\" cx=\"-80.9\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_128_\" class=\"st0\" cx=\"-78.3\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_232_\">\n" +
    "		<circle id=\"XMLID_127_\" class=\"st0\" cx=\"-72\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_126_\" class=\"st0\" cx=\"-69.5\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_125_\" class=\"st0\" cx=\"-67\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_124_\" class=\"st0\" cx=\"-72\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_123_\" class=\"st0\" cx=\"-69.6\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_122_\" class=\"st0\" cx=\"-67\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_121_\" class=\"st0\" cx=\"-72\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_120_\" class=\"st0\" cx=\"-69.5\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_119_\" class=\"st0\" cx=\"-67\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_222_\">\n" +
    "		<circle id=\"XMLID_118_\" class=\"st0\" cx=\"-94.5\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_117_\" class=\"st0\" cx=\"-91.9\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_116_\" class=\"st0\" cx=\"-89.4\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_115_\" class=\"st0\" cx=\"-94.5\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_114_\" class=\"st0\" cx=\"-92\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_113_\" class=\"st0\" cx=\"-89.5\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_112_\" class=\"st0\" cx=\"-94.5\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_111_\" class=\"st0\" cx=\"-91.9\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_110_\" class=\"st0\" cx=\"-89.4\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_212_\">\n" +
    "		<circle id=\"XMLID_109_\" class=\"st0\" cx=\"-83.1\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_108_\" class=\"st0\" cx=\"-80.6\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_107_\" class=\"st0\" cx=\"-78.1\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_106_\" class=\"st0\" cx=\"-83.1\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_105_\" class=\"st0\" cx=\"-80.6\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_104_\" class=\"st0\" cx=\"-78.1\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_103_\" class=\"st0\" cx=\"-83.1\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_102_\" class=\"st0\" cx=\"-80.6\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_101_\" class=\"st0\" cx=\"-78.1\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_202_\">\n" +
    "		<circle id=\"XMLID_100_\" class=\"st0\" cx=\"-71.7\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_99_\" class=\"st0\" cx=\"-69.2\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_98_\" class=\"st0\" cx=\"-66.7\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_97_\" class=\"st0\" cx=\"-71.8\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_96_\" class=\"st0\" cx=\"-69.3\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_95_\" class=\"st0\" cx=\"-66.8\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_94_\" class=\"st0\" cx=\"-71.7\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_93_\" class=\"st0\" cx=\"-69.2\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_92_\" class=\"st0\" cx=\"-66.7\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\" class=\"timeline-tips-tricks-icon\" width=\"30px\" height=\"30px\">\n" +
    "<style type=\"text/css\">\n" +
    "	.timeline-tips-tricks-icon .st0{fill:#fff;}\n" +
    "</style>\n" +
    "<g id=\"XMLID_203_\">\n" +
    "	<path id=\"XMLID_209_\" class=\"st0\" d=\"M-115.2,285.5\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_207_\" d=\"M-123.6,319c-0.1,0-0.2,0-0.4,0c-0.8-0.2-1.3-1-1.1-1.8c0,0,0.9-4.1-1.7-7.4c-2.2-2.8-4.7-6.6-4.7-11.4\n" +
    "		c0-9,7.3-16.4,16.4-16.4s16.4,7.3,16.4,16.4c0,4.8-2.5,8.6-4.7,11.4c-2.6,3.3-1.7,7.4-1.7,7.4c0.2,0.8-0.3,1.6-1.1,1.8\n" +
    "		c-0.8,0.2-1.6-0.3-1.8-1.1c0-0.2-1.2-5.5,2.2-9.9c2-2.6,4-5.7,4-9.6c0-7.4-6-13.4-13.4-13.4c-7.4,0-13.4,6-13.4,13.4\n" +
    "		c0,3.9,2,7,4,9.6c3.5,4.5,2.3,9.7,2.2,9.9C-122.3,318.6-122.9,319-123.6,319z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_206_\" d=\"M-107.5,322.4h-15.1c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h15.1c0.5,0,1,0.5,1,1\n" +
    "		C-106.5,322-106.9,322.4-107.5,322.4z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_205_\" d=\"M-107,325.4H-123c-0.5,0-1-0.5-1-1s0.5-1,1-1h16.1c0.5,0,1,0.5,1,1C-106,325-106.4,325.4-107,325.4z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_210_\" d=\"M-109,328.5h-12.5c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h12.5c0.5,0,1,0.5,1,1C-108,328-108.4,328.5-109,328.5z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_204_\" d=\"M-111.1,329.7c-0.3,1.6-1.8,2.3-4.1,2.3s-3.6-0.8-4.1-2.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').directive('znkTimeline', ['$window', '$templateCache', 'TimelineSrv',
        function ($window, $templateCache, TimelineSrv) {
            var directive = {
                restrict: 'A',
                scope: {
                    timelineData: '=',
                    timelineSettings: '='
                },
                link: function (scope, element) {

                    var settings = angular.extend({
                        width: $window.innerWidth,
                        height: $window.innerHeight,
                        images: TimelineSrv.getImages()
                    }, scope.timelineSettings || {});

                    var dataObj;

                    var canvasElem = element[0];

                    var ctx = canvasElem.getContext('2d');

                    var lastLine;

                    var nextFlag = false;

                    scope.$watch('timelineData', function (val, oldVal) {
                        if (angular.isDefined(val)) {
                            if (val !== oldVal) {
                                ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
                                if (val.data.length) {
                                    start(val);
                                }
                            } else {
                                start(val);
                            }
                        }
                    });

                    function start(timelineData) {

                        var width = settings.width;

                        dataObj = {
                            lastLine: [],
                            biggestScore: {score: 0}
                        };

                        lastLine = void(0);

                        if (settings.type === 'multi') {
                            var distance = settings.distance * (timelineData.data.length + 2);
                            width = (distance < settings.width) ? settings.width : distance;
                        }

                        if (settings.isMax) {
                            settings.max = 0;
                            angular.forEach(timelineData.data, function (value) {
                                if (value.score > settings.max) {
                                    settings.max = value.score;
                                }
                            });
                        }

                        canvasElem.width = width * 2;
                        canvasElem.height = settings.height * 2;

                        canvasElem.style.width = width + 'px';
                        canvasElem.style.height = settings.height + 'px';

                        ctx.scale(2, 2);

                        if (settings.lineWidth) {
                            ctx.lineWidth = settings.lineWidth;
                        }

                        if (angular.isDefined(timelineData.id) && settings.colors && angular.isArray(settings.colors)) {
                            ctx.strokeStyle = settings.colors[timelineData.id];
                            ctx.fillStyle = settings.colors[timelineData.id];
                        }

                        ctx.beginPath();

                        createPath({
                            moveTo: {
                                x: 0,
                                y: settings.height - 2
                            },
                            lineTo: {
                                x: settings.distance,
                                y: settings.height - 2
                            }
                        }, true);

                        angular.forEach(timelineData.data, function (value, index) {

                            var height = Math.abs((settings.height - settings.subPoint) - ((value.score - settings.min) / (settings.max - settings.min) * (settings.height - (settings.subPoint * 2)) ));
                            var currentDistance = (index + 2) * settings.distance;
                            var isLast = index === (timelineData.data.length - 1);
                            value.moveTo = {
                                x: lastLine.lineTo.x,
                                y: lastLine.lineTo.y
                            };

                            value.lineTo = {
                                x: currentDistance,
                                y: height
                            };

                            createPath(value, false, isLast);

                            if (value.score > dataObj.biggestScore.score) {
                                dataObj.biggestScore = {score: value.score, lastLineTo: lastLine.lineTo};
                            }

                        });

                        if (settings.numbers && angular.isObject(settings.numbers)) {

                            setTimeout(function () {

                                ctx.font = settings.numbers.font;
                                ctx.fillStyle = settings.numbers.fillStyle;

                                ctx.fillText(settings.min, 15, settings.height - 10);
                                ctx.fillText(parseInt(dataObj.biggestScore.score), 15, dataObj.biggestScore.lastLineTo.y || settings.subPoint);

                            });

                        }

                        if (settings.onFinish && angular.isFunction(settings.onFinish)) {
                            settings.onFinish({data: dataObj, ctx: ctx, canvasElem: canvasElem});
                        }

                    }

                    function createPath(data, ignoreAfterPath, isLast) {

                        var arc = 10;
                        var img = 20;

                        if (angular.isDefined(settings.isMobile) && !settings.isMobile) {
                            arc = 15;
                            img = 25;
                        }

                        var subLocation = img / 2;

                        lastLine = data;
                        dataObj.lastLine.push(lastLine);

                        /* create line */
                        ctx.moveTo(data.moveTo.x, data.moveTo.y);
                        ctx.lineTo(data.lineTo.x, data.lineTo.y);
                        ctx.stroke();

                        if (dataObj.summeryScore && !nextFlag) {
                            dataObj.summeryScore.next = data.lineTo;
                            nextFlag = true;
                        }

                        if (settings.isSummery) {
                            if (settings.isSummery === data.exerciseId) {
                                dataObj.summeryScore = {
                                    score: data.score, lineTo: data.lineTo,
                                    prev: dataObj.lastLine[dataObj.lastLine.length - 2]
                                };
                                arc = arc * 1.5;
                                img = img + 5;
                                subLocation = img / 2;
                            }
                        } else if (isLast) {
                            arc = arc * 1.5;
                            img = img + 5;
                            subLocation = img / 2;
                        }


                        if (!ignoreAfterPath) {
                            /* create circle */
                            ctx.beginPath();
                            ctx.arc(data.lineTo.x, data.lineTo.y, arc, 0, 2 * Math.PI, false);
                            ctx.fill();

                            if ((isLast && !settings.isSummery) || (settings.isSummery === data.exerciseId)) {
                                ctx.beginPath();
                                ctx.arc(data.lineTo.x, data.lineTo.y, arc + 4, 0, 2 * Math.PI, false);
                                ctx.stroke();
                            }

                            /* create svg icons */
                            var imageObj = new Image();
                            var src;
                            var locationImgY = data.lineTo.y - subLocation;
                            var locationImgX = data.lineTo.x - subLocation;

                            if (data.iconKey) {
                                src = settings.images[data.iconKey];

                                var svg = $templateCache.get(src);
                                var mySrc = (svg) ? 'data:image/svg+xml;base64,' + $window.btoa(svg) : src;

                                imageObj.onload = function () {
                                    ctx.drawImage(imageObj, locationImgX, locationImgY, img, img);
                                };

                                imageObj.src = mySrc;
                            }
                        }

                    }

                }
            };

            return directive;
        }]);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').provider('TimelineSrv', ['SvgIconSrvProvider', function () {

        var imgObj;

        this.setImages = function(obj) {
            imgObj = obj;
        };

        this.$get = ['$log', function($log) {
             return {
                 getImages: function() {
                     if (!angular.isObject(imgObj)) {
                         $log.error('TimelineSrv getImages: obj is not an object! imgObj:', imgObj);
                     }
                     return imgObj;
                 }
             };
        }];
    }]);
})(angular);

