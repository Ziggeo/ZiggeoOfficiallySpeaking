App.Globals.express.listen(App.Config.server_port, function() {
	console.log("Listening on " + App.Config.server_port);
});