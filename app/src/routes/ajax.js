App.Globals.express.post('/ajax/vote/:submission_id', function (request, response) {
	App.Controllers.AjaxController.dispatch("vote", request, response);
});