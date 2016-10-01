
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
		if (typeof feedId !== 'undefined') {
			var info = findFeedInfo(feedId);
			if (!info) {
				info = { id: feedId };
				store.feeds.push(info);
				pollFeedInfo(feedId);
			}
		}
	}

	function pollFeedInfo(feedId) {
		request("GET", store.database + "/" + feedId, function(response) {
			var info = findFeedInfo(feedId);
			info.data = response.data;
			intf.addFeed(info.data);
		});
	}

	function pollFirstChangesFeed() {
		var query = "since=0&limit=50&descending=true";
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
						requireFeedInfo(res.doc.feedId);
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
