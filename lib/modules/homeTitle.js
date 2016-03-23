/************************************************************************************************************

Creating your own module:

All modules must have an ID, which is the first parameter passed into addModule.

In addition, modules must have the following required properties:
- moduleName - a "nice name" for your module
- category - a category such as "Comments" for the module to reside under
- description - an explanation of the module's functionality
- include (optional) - an array of page types or regexes to match against location.href
- exclude (optional) - an array of page types or regexes to exclude against location.href
- beforeLoad (optional) code to run after <head> is ready and this module's options are loaded
- go - code to run after <body> is ready. Always checks if both isEnabled() and isMatchURL(), and if so, runs your main code.

Add the file to all the browser manifests! You can use `gulp add-module --file module.js` (replace `module.js` with your filename).

************************************************************************************************************/

addModule('homeTitle', function(module, moduleID) {
	module.moduleName = 'Home Title';
	module.category = 'Appearance';
	module.description = 'Gives a proper title to the front page.';
	module.options = {
		// Any configurable options go here.
		// Options must have a type and a value..
		// Valid types: text, boolean, color (in hexadecimal form), list
		// For example:
		title: {
			type: 'text',
			value: 'MIT Discussion',
			description: 'Title to display'
		},
	};

	// See RESUtils.pageType (utils.js) for other page types
	module.include = [
		'all'
	];
	module.exclude = [
	];

	module.beforeLoad = function() {
		if ((module.isEnabled()) && (module.isMatchURL())) {
			var title = document.title;
			var replacementSiteName = this.options.title.value;
			document.title = title.replace("discussion\.mit\.edu", replacementSiteName);
		}
	};
});
