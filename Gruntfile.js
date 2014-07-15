module.exports = function(grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		/*
		copy : {
			dist: {
			    files: [
			      {expand: true, cwd: "./app/src/assets", src: '**', dest: "./app/httpd/assets"}
			    ]
			}		     
		},
		*/
		concat : {
			"./app/dist/server.js": [
				"./app/src/app/init.js",
                "./app/src/app/strings.js",
				"./app/src/services/*",
				"./app/src/controllers/controller.js",
				"./app/src/controllers/*",
				"./app/src/routes/*",
				"./app/src/app/run.js",
			]
		},
		watch : {
		},
		sass : {
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-text-replace');
	
	grunt.registerTask('default', [/*'copy', */'concat']);

};
