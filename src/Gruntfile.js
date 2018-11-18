"user strict";

const mozjpeg = require("imagemin-mozjpeg");

module.exports = function(grunt) {
  grunt.initConfig({
    clean: {
      build: {
        src: ['./src/img_resized', './src/img/*.jpg']
      }
    },
    responsive_images: {
      myTask: {
        options: {
          sizes: [
            {
              name: "large",
              width: 1024
            },
            {
              name: "medium",
              width: 800
            },
            {
              name: "small",
              width: 320
            }
          ]
        },
        files: [
          {
            expand: true,
            cwd: "./src/img_original",
            src: ["**.{jpg,gif,png}"],
            dest: "./src/img_resized"
          }
        ]
      }
    },

    imagemin: {
      dynamic: {
        options: {
          optimizationLevel: 8,
          progressive: true,
          svgoPlugins: [{ removeViewBox: false }],
          use: [mozjpeg()]
        },
        files: [
          {
            expand: true,
            cwd: "./src/img_resized",
            src: ["**/*.{png,jpg,jpeg,gif}"],
            dest: "./src/img"
          }
        ]
      }
    }
  });
  // Load the plugin that provides the task we need to perform.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks("grunt-responsive-images");
  grunt.loadNpmTasks("grunt-contrib-imagemin");

  // Default task(s).
  grunt.registerTask("default", ["clean", "responsive_images", "imagemin"]);
  grunt.registerTask("min", ["imagemin"]);
};
