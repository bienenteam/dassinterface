
/*
Parameters:
intf: {
addFeedItemTop: function(item_info) - Add a feed item on top of the item list.
addFeedItemBottom: function(item_info) - Add a feed item at the bottom.
addFeed: function(feed_info) - Add a feed to the list of available feeds.
}

*/
function RssDB(intf) {
	var store = {
		database: "/beehive",
		pollInterval: 2000,
		updateHandle: null, // The timeout handle for managing interval update calls.
		lastSequence: 0, // The last sequence number that was polled from the database.
		loadLimit: 50, // The maximum count of changes to poll in one interval.
		prevLoadCount: 25, // The number of changes to load if the user scrolls down.
		minSequence: Number.MAX_VALUE, // The sequence number of the oldest item.
		didFirstPoll: false,
		filterHideFeeds: [], // An array of feed ids that's items should not be displayed.
		feeds: [], // All feed information.
		catchErrors: false
	};



	// Safely call a function passed by top level api.
	function upcall(fn, arg) {
		if (store.catchErrors) {
			try {
				fn(arg);
			} catch(err) {
				console.error(err);
			}
		} else {
			fn(arg);
		}
	}

	// Set if errors from the toplevel api should be cacthed.
	function setCatchErrors(enabled) {
		store.catchErrors = enabled;
	}

	// Find an existing feed info by its id.
	function findFeedInfo(feedId) {
		for(var i = 0; i < store.feeds.length; i++)
		if (store.feeds[i].id == feedId)
		return store.feeds[i];
		return null;
	}

	// Poll a feed info if it is not present.
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

	// Poll or update a feed info and store it.
	function pollFeedInfo(feedId) {
		request("GET", store.database + "/" + feedId, function(response) {
			var info = findFeedInfo(feedId);
			info.data = response.data;
			upcall(intf.addFeed, info.data);
		});
	}

	// Do the initial changes poll.
	function pollFirstChangesFeed() {
		var query = "since=0&limit=" + store.loadLimit + "&descending=true";
		request("GET", store.database + "/_changes?" + query, function(response) {
			if (!store.didFirstPoll) {
				store.didFirstPoll = true;
				store.lastSequence = Math.max(0, response.data.last_seq);

				updateNextFrame();
			}
		});
	}

	// Poll latest item changes or new items.
	function pollChangedFeedItems() {
		if (store.didFirstPoll) {
			var query = "include_docs=true&since=" + store.lastSequence
			+ "&limit=" + store.loadLimit;
			request("GET", store.database + "/_changes?" + query, function(response) {
				var results = response.data.results;
				if (response.data.last_seq < store.minSequence)
					store.minSequence = response.data.last_seq;
				for(var i = 0; i < results.length; i++) {
					var res = results[i];
					if (res.doc.type == "item" && store.filterHideFeeds.indexOf(res.doc.feedId) < 0) {
						upcall(intf.addFeedItemTop, res.doc);
						requireFeedInfo(res.doc.feedId);

						if (res.seq < store.minSequence)
							store.minSequence = res.seq;
					}
				}
				store.lastSequence = response.data.last_seq;
			});
		} else {
			pollFirstChangesFeed();
		}
	}

	// Load old items.
	function pollPrevious() {
		var oldMinSequence = store.minSequence;
		store.minSequence -= store.prevLoadCount;
			var query = "include_docs=true&since=" + store.minSequence
			+ "&limit=" + (oldMinSequence - store.minSequence);
		request("GET", store.database + "/_changes?" + query, function(response) {
			var results = response.data.results;
			for(var i = results.length - 1; i >= 0; i--) {
				var res = results[i];
				if (res.doc.type == "item" && store.filterHideFeeds.indexOf(res.doc.feedId) < 0) {
					upcall(intf.addFeedItemBottom, res.doc);
					requireFeedInfo(res.doc.feedId);
				}
			}
		});
	}



	// Set a feed as hidden.
	function setHideFeed(id) {
		store.filterHideFeeds.push(id);
		resetPollSequence();
	}

	// Set a feed as shown.
	function setShowFeed(id) {
		var i = store.filterHideFeeds.indexOf(id);
		if(i >= 0) {
			store.filterHideFeeds.splice(i, 1);
		}
		resetPollSequence();
	}

	// Reset, which items have been polled.
	function resetPollSequence() {
		store.lastSequence = 0;
		store.didFirstPoll = false;
		store.minSequence = Number.MAX_VALUE;

		if (store.updateHandle != null)
		updateNextFrame();
	}

	// Update when this call ends.
	function updateNextFrame() {
		setTimeout(updateNow, 0);
	}

	// Update now.
	function updateNow() {
		if (store.updateHandle == null) {
			update();
			clearTimeout(store.updateHandle);
			store.updateHandle = null;
		} else {
			clearTimeout(store.updateHandle);
			update();
		}
	}

	// Update now and set the timeout for the next update.
	function update() {
		store.updateHandle = setTimeout(update, store.pollInterval);
		pollChangedFeedItems();
	}

	// Start updating.
	function start() {
		if (store.updateHandle == null)
		update();
	}

	// Stop updating.
	function stop() {
		if (store.updateHandle != null) {
			clearTimeout(store.updateHandle);
			store.updateHandle = null;
			resetPollSequence();
		}
	}



	// Do a http request using json request and response entities.
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
	this.pollPrevious = pollPrevious; // Load previous items.
	this.setCatchErrors = setCatchErrors; // Set if errors should be catched.
}
