App.Controllers.Controller.extend("App.Controllers.AjaxController", {}, {

    vote : function(request, response, callbacks) {
        App.Services.SubmissionsService.read(request.params.submission_id, BetaJS.SyncAsync.mapSuccess(callbacks, function (submission) {
            App.Services.SubmissionsService.update(submission.id, {
                votes: submission.votes + 1
            }, callbacks);
        }));
    }
	
});
