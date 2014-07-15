App.Globals.express.get('/', function (request, response) {
	App.Controllers.ViewsController.dispatch("index", request, response);
});

App.Globals.express.get('/answer', function (request, response) {
    App.Controllers.ViewsController.dispatch("answer_index", request, response);
});

App.Globals.express.get('/submit', function (request, response) {
    App.Controllers.ViewsController.dispatch("new_submission", request, response);
});

App.Globals.express.post('/submit', function (request, response) {
    App.Controllers.ViewsController.dispatch("create_submission", request, response);
});

App.Globals.express.get('/answer/:submission_id', function (request, response) {
    App.Controllers.ViewsController.dispatch("new_answer", request, response);
});

App.Globals.express.post('/answer/:submission_id', function (request, response) {
    App.Controllers.ViewsController.dispatch("create_answer", request, response);
});
