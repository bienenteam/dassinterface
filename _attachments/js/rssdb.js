
function RssDB(intf) {
	var store = {
		database: "http://93.180.156.188:5984/simdata",
		pollInterval: 1500,
		updateHandle: null,
		lastSequence: 0,
		didFirstPoll: false
	};



	function pollFirstChangesFeed() {
		var query = "include_docs=true&since=" + store.lastSequence
			+ "&limit=1&descending=true";
		request("GET", store.database + "/_changes?" + query, function(response) {
			if (!store.didFirstPoll) {
				store.didFirstPoll = true;
				store.lastSequence = Math.max(0, response.data.last_seq - 50);
			}
		});
	}

	function pollChangedFeedItems() {
		if (store.didFirstPoll) {
			var query = "include_docs=true&since=" + store.lastSequence
				+ "&limit=50";
			request("GET", store.database + "/_changes?" + query, function(response) {
				var results = response.data.results;
				for(var i = 0; i < results.length; i++)
					if (results[i].doc.type == "item")
						intf.addFeedItem(results[i].doc);

				store.lastSequence = response.data.last_seq;
			});
		} else {
			pollFirstChangesFeed();
		}
	}



	function update() {
		store.updateHandle = setTimeout(update, store.pollInterval);
		pollChangedFeedItems();
	}

	function start() {
		if (store.updateHandle == null)
			update();
	}

	function stop() {
		if (store.updateHandle != null) {
			clearTimeout(store.updateHandle);
			store.updateHandle = null;
		}
	}



	function request(method, url, callback, body) {
		var rx = new XMLHttpRequest();
		rx.open(method, url);
		rx.addEventListener('load', function() {
			callback({
				data: JSON.parse(rx.responseText)
			});
		});

		if (body)
			rx.send(JSON.stringify(body));
		else
			rx.send();
	}

	this.start = start;
	this.stop = stop;
}





function RssDBTest(intf) {
	var i = 0;

	function run() {
		intf.addFeedItem({
			title: "Example title (" + i + ")",
			id: i,
			link: "http://example.com/",
			summary: "Example summary blabla...",
			content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
		});
		i++;

		setTimeout(run, 2000);
	}

	run();
}
