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
