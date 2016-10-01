
function RssDB(intf) {
	var itemSource = "testdb";
	var itemFields = ["_id", "_rev", "title"];
	var pollInterval = 1500;
	var updateHandle = null;

	function pollInitialFeedItems() {
		request("POST", itemSource + "/_find", function(response) {
			var feedItems = response.data.docs;
			for(var i = 0; i < feedItems.length; i++) {
				intf.addFeedItem(feedItems[i]);
			}
		}, {
			selector: { type: "item" },
			fields: itemFields,
			sort: [{published: "desc"}],
			limit: 50,
			skip: 0
		});
	}

	function pollChangedFeedItems() {
		request("POST", itemSource + "/_changes?filter=_selector&include_docs=true", function(response) {
			var results = response.data.results;
			for(var i = 0; i < results.length; i++) {
				intf.addFeedItem(results[i].doc);
			}
		}, {
			selector: { type: "item" }
		});
	}



	function update() {
		updateHandle = setTimeout(update, pollInterval);
		pollChangedFeedItems();
	}

	function start() {
		if (updateHandle == null)
			update();
	}

	function stop() {
		if (updateHandle != null) {
			clearTimeout(updateHandle);
			updateHandle = null;
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
		rx.send(body);
	}

	pollInitialFeedItems();

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
