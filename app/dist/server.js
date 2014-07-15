BetaJS = require("../../libraries/betajs/dist/beta-server.js");

App = {};

App.Config = require('fs').existsSync(__dirname + "/../../config.js") ?
             require("../../config.js") :
             require("../../config.default.js");

App.Modules = {
	Express: require("express"),
	Morgan: require("morgan"),
	CookieParser: require("cookie-parser"),
	BodyParser: require("body-parser"),
	Erb: require("ejs"),
	Ziggeo: require("../../libraries/ziggeo/ziggeo-sdk.min.js")
};

App.Modules.Ziggeo.init(App.Config.ziggeo_token, App.Config.ziggeo_private_key);

App.Globals = {
	express: App.Modules.Express(),
	mongodb: new BetaJS.Databases.MongoDatabase(App.Config.mongodb, {sync: false, async: true})
};

App.Globals.submissions_table = new BetaJS.Databases.MongoDatabaseTable(App.Globals.mongodb, "submissions");
App.Globals.submissions_table.ensureIndex("created");
App.Globals.submissions_table.ensureIndex("updated");
App.Globals.submissions_table.ensureIndex("votes");

App.Services = {};

App.Globals.express.use(App.Modules.Morgan());
App.Globals.express.use(App.Modules.CookieParser(App.Config.cookie_key));
App.Globals.express.use(App.Modules.BodyParser());
App.Globals.express.engine('erb', App.Modules.Erb.renderFile);
App.Globals.express.set('views', __dirname + '/../src/views');
//App.Globals.express.use(App.Modules.Express["static"](__dirname + '/../httpd'));

BetaJS.Locales.register({
    "shared.title": "Officially Speaking",
    "shared.asker": "Citizen",
    "shared.answerer": "Official",
    "shared.heading": "Ask NYC Officials"
}, "app");

BetaJS.Exceptions.Exception.extend("App.Services.ServiceException", {
	
	constructor: function (code, data) {
		data = data || {};
		this.__data = data;
		this.__code = code;
		this._inherited(App.Services.ServiceException, "constructor", BetaJS.Net.HttpHeader.format(code, true));
	},
	
	code: function () {
		return this.__code;
	},
	
	data: function () {
		return this.__data;
	}
	
});

App.Services.SubmissionsService = {
    
    /*
     * answered: (default false)
     * unanswered: (default false)
     * limit: (default 10)
     * skip: (default 0)
     */
    index : function (options, callbacks) {
        options = options || {};
        var query = {};
        if (options.answered)
            query["answer_video"] = {"$ne" : null};
        else if (options.unanswered)
            query["answer_video"] = null;
        var opts = {
            limit: options.limit || 10,
            skip: options.skip || 0,
            sort: {votes: -1, created: -1}
        };
        return App.Globals.submissions_table.find(query, opts, callbacks);
    },
    
    create : function (data, callbacks) {
        App.Globals.submissions_table.insertRow(BetaJS.Objs.extend({
            created: BetaJS.Time.now(),
            updated: BetaJS.Time.now(),
            votes: 0,
            title: null,
            question_author: null,
            answer_author: null, 
            question_video: null,
            answer_video: null 
        }, data), callbacks);
    },
    
    read : function (submission_id, callbacks) {
        App.Globals.submissions_table.findById(submission_id, callbacks);
    },
    
    update : function (submission_id, data, callbacks) {
        data["updated"] = BetaJS.Time.now();
        App.Globals.submissions_table.updateById(submission_id, data, callbacks);
    }

};

BetaJS.Class.extend("App.Controllers.Controller", {}, {
	
	dispatch: function (method, request, response, next) {
		var self = this;
		self[method](request, response, {
			success: function () {
				if (BetaJS.Types.is_defined(next))
					next();
			},
			exception: function (e) {
				e = App.Services.ServiceException.ensure(e);
				response.status(e.code()).send(JSON.stringify(e.data()));
			}
		});
	}
		
});
App.Controllers.Controller.extend("App.Controllers.AjaxController", {}, {

    vote : function(request, response, callbacks) {
        App.Services.SubmissionsService.read(request.params.submission_id, BetaJS.SyncAsync.mapSuccess(callbacks, function (submission) {
            App.Services.SubmissionsService.update(submission.id, {
                votes: submission.votes + 1
            }, callbacks);
        }));
    }
	
});

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

App.Globals.express.post('/ajax/vote/:submission_id', function (request, response) {
	App.Controllers.AjaxController.dispatch("vote", request, response);
});
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

App.Globals.express.listen(App.Config.server_port, function() {
	console.log("Listening on " + App.Config.server_port);
});