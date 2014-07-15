App.Controllers.Controller.extend("App.Controllers.ViewsController", {}, {
    
    __index: function (options, request, response, callbacks) {
        App.Services.SubmissionsService.index({answered: true, unanswered: false}, BetaJS.SyncAsync.mapSuccess(callbacks, function (answered) {
            App.Services.SubmissionsService.index({answered: false, unanswered: true}, BetaJS.SyncAsync.mapSuccess(callbacks, function (unanswered) {
                response.render('index.html.erb', {
                    answered: answered.asArray(),
                    unanswered: unanswered.asArray(),
                    enable_answers: options.enable_answers
                });
                callbacks.success();
            }));
        }));
    },

    index : function(request, response, callbacks) {
        return this.__index({}, request, response, callbacks);
    },
    
    answer_index : function(request, response, callbacks) {
        return this.__index({enable_answers: true}, request, response, callbacks);
    },
    
    new_submission : function(request, response, callbacks) {
        response.render('new_submission.html.erb', {});
        callbacks.success();
    },
    
    create_submission : function(request, response, callbacks) {
        var self = this;
        App.Services.SubmissionsService.create({
           question_author: request.body.question_author,
           question_video: request.body.question_video,
           title: request.body.title
        }, BetaJS.SyncAsync.mapSuccess(callbacks, function () {
            self.index(request, response, callbacks);
        }));
    },
    
    new_answer : function(request, response, callbacks) {
        App.Services.SubmissionsService.read(request.params.submission_id, BetaJS.SyncAsync.mapSuccess(callbacks, function (submission) {
            response.render('new_answer.html.erb', {submission: submission});
            callbacks.success();            
        }));
    },
    
    create_answer : function(request, response, callbacks) {
        var self = this;
        App.Services.SubmissionsService.update(request.params.submission_id, {
           answer_author: request.body.answer_author,
           answer_video: request.body.answer_video,
        }, BetaJS.SyncAsync.mapSuccess(callbacks, function () {
            self.answer_index(request, response, callbacks);
        }));
    }
    
});
