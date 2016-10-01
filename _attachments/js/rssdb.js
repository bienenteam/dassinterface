
/*
intf fields:
	addFeedItem(item)
	addFeed(feed)

*/
function RssDB(intf) {
	var store = {
		database: "http://93.180.156.188:5984/simdata",
		pollInterval: 1500,
		updateHandle: null,
		lastSequence: 0,
		didFirstPoll: false,
		filterHideFeeds: [],
		feeds: []
	};



	function findFeedInfo(feedId) {
		for(var i = 0; i < store.feeds.length; i++)
			if (store.feeds[i].id == feedId)
				return store.feeds[i];
		return null;
	}

	function requireFeedInfo(feedId) {
		var info = findFeedInfo(feedId);
		if (!info) {
			info = { id: feedId };
			store.feeds.push(info);
			pollFeedInfo(feedId);
		}
	}

	function pollFeedInfo(feedId) {
		/* Uncomment this when feedIds are implemented...
		request("POST", store.database + "/_find", function(response) {
			var docs = response.data.docs;
			if (docs.length > 0) {
				var info = findFeedInfo(feedId);
				info.data = docs[0];
				intf.addFeed(info.data);

			} else {
				console.warn("Unable to find ");
			}
		}, {
			selector: { type: "feed", _id: feedId }
		});
		*/

		var info = findFeedInfo(feedId);
		info.data = {
			_id: "yeee930329482039480394",
			name: "A Feed!",
			url: "http://www.google.de/"
		};
		intf.addFeed(info.data);
	}

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
				for(var i = 0; i < results.length; i++) {
					var res = results[i];
					if (res.doc.type == "item" && store.filterHideFeeds.indexOf(res.doc.feedId) < 0) {
						intf.addFeedItem(res.doc);

						// Replace with 'res.feedId'
						requireFeedInfo("testFeed0000001010010101");
					}
				}

				store.lastSequence = response.data.last_seq;
			});
		} else {
			pollFirstChangesFeed();
		}
	}



	function setHideFeed(id) {
		store.filterHideFeeds.push(id);
		resetPollSequence();
	}

	function setShowFeed(id) {
		var i = store.filterHideFeeds.indexOf(id);
		if(i >= 0)
			store.filterHideFeeds.splice(i, 1);
		resetPollSequence();
	}

	function resetPollSequence() {
		store.lastSequence = 0;
		store.didFirstPoll = false;
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
			resetPollSequence();
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

	this.start = start; // Start polling changes.
	this.stop = stop; // Stop polling changes and reset the sequence.
	this.setHideFeed = setHideFeed; // (id) Hide all feed items by feed id.
	this.setShowFeed = setShowFeed; // (id) Show all feed items by feed id.
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
