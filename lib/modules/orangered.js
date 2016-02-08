addModule('orangered', function(module, moduleID) {
	module.moduleName = 'Unread Messages';
	module.category = 'My account';
	module.description = 'Helping you get your daily dose of orangereds';

	module.options = {
		openMailInNewTab: {
			description: 'When clicking the mail envelope or modmail icon, open mail in a new tab?',
			type: 'boolean',
			value: false
		},
		updateCurrentTab: {
			description: 'Update mail buttons on current tab when RES checks for orangereds',
			type: 'boolean',
			value: true,
		},
		updateOtherTabs: {
			description: 'Update all open tabs when RES checks for orangereds',
			type: 'boolean',
			value: true,
		},
		showFloatingEnvelope: {
			type: 'boolean',
			value: true,
			description: 'Show an envelope (inbox) icon in the top right corner'
		},
		hideUnreadCount: {
			type: 'boolean',
			value: false,
			description: 'Hide unread message count',
			bodyClass: true
		},
		retroUnreadCount: {
			type: 'boolean',
			value: false,
			description: 'If you dislike the unread count provided by native reddit, you can replace it with the RES-style bracketed unread count',
			bodyClass: true
		},
		showUnreadCountInTitle: {
			type: 'boolean',
			value: false,
			description: 'Show unread message count in page/tab title?'
		},
		showUnreadCountInFavicon: {
			type: 'boolean',
			value: true,
			description: 'Show unread message count in favicon?'
		},
		resetFaviconOnLeave: {
			type: 'boolean',
			value: true,
			description: 'Reset the favicon before leaving the page. \n\n This prevents the unread badge from appearing in bookmarks, but may hurt browser caching.'
		},
		unreadLinksToInbox: {
			type: 'boolean',
			value: false,
			description: 'Always go to the inbox, not unread messages, when clicking on orangered',
			advanced: true,
			dependsOn: 'updateCurrentTab'
		},
		hideModMail: {
			type: 'boolean',
			value: false,
			description: 'Hide the mod mail button in user bar.',
			bodyClass: true
		}
	};

	var favicon;
	var mailButton, nativeMailCount;
	var floatingInboxButton, floatingInboxCount;

	module.go = function() {
		if (!(module.isEnabled() && module.isMatchURL())) return;

		if (module.options.openMailInNewTab.value) {
			$('#mail, #modmail').attr('target', '_blank');
		}

		if (RESUtils.loggedInUser() !== null) {
			setupFaviconBadge();
			setupFloatingButtons();

			updateFromPage();
		}
	};

	module.updateFromPage = updateFromPage;
	function updateFromPage(doc) {
		if (!module.options.updateCurrentTab.value) return;

		var count = getUnreadCount(doc);

		// the new way of getting message count is right from reddit, as it will soon
		// output the message count, replacing RES's check.
		if (typeof count !== 'undefined') {
			setUnreadCount(count, doc && 'ner');
		} else if (!doc) {
			// if the countDiv doesn't exist, we still need to use the old way of polling
			// reddit for unread count
			var msgCountCacheKey = 'RESmodules.' + moduleID + '.msgCount.' + RESUtils.loggedInUser();
			RESUtils.cache.fetch({
				key: msgCountCacheKey,
				endpoint: 'message/unread/.json?mark=false',
				handleData: function(response) {
					return response.data.children.length || 0;
				},
				callback: setUnreadCount
			});
		}
	}

	module.setUnreadCount = setUnreadCount;
	function setUnreadCount(count, source) {
		updateFaviconBadge(count);
		updateTitle(count);
		updateInboxElements(count, source);
		updateMailCountElements(count, source);

		if (module.options.updateOtherTabs.value && (source !== 'rpc') && typeof count !== 'undefined') {
			RESEnvironment.sendMessage({
				requestType: 'multicast',
				moduleID: moduleID,
				method: 'setUnreadCount',
				arguments: [ count ]
			});
		}
	}

	function updateTitle(count) {
		if (!module.options.showUnreadCountInTitle.value) return;
		if (count > 0) {
			document.title = '[' + count + '] ' + document.title.replace(/^\[[\d]+\]\s/, '');
		} else {
			document.title = document.title.replace(/^\[[\d]+\]\s/, '');
		}
	}
	function updateInboxElements(count, source) {
		count = count || 0;
		var $ele = $(floatingInboxButton);
		if (module.options.updateCurrentTab.value && (source === 'rpc' || source === 'ner')) {
			$ele = $ele.add(mailButton);
		}

		$ele.attr('title', count ? 'new mail!' : 'No new mail')
			.toggleClass('havemail', !!count)
			.toggleClass('nohavemail', !count)
			.attr('href', getInboxLink(count));
	}
	function updateMailCountElements(count, source) {
		if (nativeMailCount && module.options.updateCurrentTab.value && (source === 'rpc' || source === 'ner')) {
			nativeMailCount.style.display = count ? 'inline-block' : 'none';
			nativeMailCount.textContent = count;
		}

		if (floatingInboxCount) {
			floatingInboxCount.style.display = count ? 'inline-block' : 'none';
			floatingInboxCount.textContent = count;
			floatingInboxCount.classList.add('message-count');
		}
	}
	function updateFaviconBadge(count) {
		if (!module.options.showUnreadCountInFavicon.value) return;
		setupFaviconBadge();

		count = count || 0;
		favicon.badge(count);
	}
	function setupFaviconBadge() {
		if (favicon) return;
		if (!module.options.showUnreadCountInFavicon.value) return;

		var faviconDataurl = 'data:image/x-icon;base64,AAABAAkAICAQAAEABADoAgAAlgAAABgYEAABAAQA6AEAAH4DAAAQEBAAAQAEACgBAABmBQAAICAAAAEACACoCAAAjgYAABgYAAABAAgAyAYAADYPAAAQEAAAAQAIAGgFAAD+FQAAICAAAAEAIACoEAAAZhsAABgYAAABACAAiAkAAA4sAAAQEAAAAQAgAGgEAACWNQAAKAAAACAAAABAAAAAAQAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8A/wCAAIAA/wAAAIAAAAD//wAAgIAAAAD/AAAAgAAAAP//AACAgAAAAP8AAACAAP///wDAwMAAgICAAAAAAADMzMzMzMzMzMzMzMzMzMzMzMu7u7zMzMzMzMzLu7u8zMzLu7u8zMzMzMzMy7u7vMzMy7u7vMzMzMzMzMu7u7zMzMu7u7zMzMzMzMzLu7u8zMzLu7u8zMzMzMzMy7u7vMzMy7u7vMzMzMzMzMu7u7zMzMu7u7zMzMzMzMzLu7u8zMzLu7u8zMzMzMzMy7u7vMzMy7u7vMzMzMzMzMu7u7zMzMu7u7zMzMzMzMzLu7u8zMzLu7u8zMu7u7zMy7u7vMzMy7u7vMzLu7u8zMu7u7zMzMu7u7zMy7u7vMzLu7u8zMzLu7u8zMu7u7zMy7u7vMzMy7u7vMzLu7u8zMu7u7zMzMu7u7zMy7u7vMzLu7u8zMzLu7u8zMu7u7zMy7u7vMzMy7u7vMzLu7u8zMu7u7zMzMu7u7zMy7u7vMzLu7u8zMzLu7u8zMu7u7zMy7u7vMzMy7u7vMzLu7u8zMu7u7zMzMu7u7zMy7u7vMzLu7u8zMzLu7u8zMu7u7zMy7u7vMzMy7u7vMzLu7u8zMu7u7zMzMu7u7zMy7u7vMzLu7u8zMzLu7u8zMu7u7zMy7u7vMzMy7u7vMzLu7u8zMu7u7zMzMu7u7zMy7u7vMzLu7u8zMzLu7u8zMu7u7zMy7u7vMzMy7u7vMzLu7u8zMu7u7zMzMzMzMzMzMzMzMzMzMzMzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAABgAAAAwAAAAAQAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8A/wCAAIAA/wAAAIAAAAD//wAAgIAAAAD/AAAAgAAAAP//AACAgAAAAP8AAACAAP///wDAwMAAgICAAAAAAADMzMzMzMzMzMzMzMzMu7u8zMzMzMu7u8zMu7u8zMzMzMu7u8zMu7u8zMzMzMu7u8zMu7u8zMzMzMu7u8zMu7u8zMzMzMu7u8zMu7u8zMzMzMu7u8zMu7u8zMzMzMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMu7u8zLu7zMu7u8zMzMzMzMzMzMzMzMwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAEAAAACAAAAABAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/wD/AIAAgAD/AAAAgAAAAP//AACAgAAAAP8AAACAAAAA//8AAICAAAAA/wAAAIAA////AMDAwACAgIAAAAAAAMzMzMzMzMzMy7vMzMzLu8zLu8zMzMu7zMu7zMzMy7vMy7vMzMzLu8zLu8zMzMu7zMu7zLu8y7vMy7vMu7zLu8zLu8y7vMu7zMu7zLu8y7vMy7vMu7zLu8zLu8y7vMu7zMu7zLu8y7vMy7vMu7zLu8zLu8y7vMu7zMu7zLu8y7vMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAgAAAAQAAAAAEACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8AzP//AJn//wBm//8AM///AAD//wD/zP8AzMz/AJnM/wBmzP8AM8z/AADM/wD/mf8AzJn/AJmZ/wBmmf8AM5n/AACZ/wD/Zv8AzGb/AJlm/wBmZv8AM2b/AABm/wD/M/8AzDP/AJkz/wBmM/8AMzP/AAAz/wD/AP8AzAD/AJkA/wBmAP8AMwD/AAAA/wD//8wAzP/MAJn/zABm/8wAM//MAAD/zAD/zMwAzMzMAJnMzABmzMwAM8zMAADMzAD/mcwAzJnMAJmZzABmmcwAM5nMAACZzAD/ZswAzGbMAJlmzABmZswAM2bMAABmzAD/M8wAzDPMAJkzzABmM8wAMzPMAAAzzAD/AMwAzADMAJkAzABmAMwAMwDMAAAAzAD//5kAzP+ZAJn/mQBm/5kAM/+ZAAD/mQD/zJkAzMyZAJnMmQBmzJkAM8yZAADMmQD/mZkAzJmZAJmZmQBmmZkAM5mZAACZmQD/ZpkAzGaZAJlmmQBmZpkAM2aZAABmmQD/M5kAzDOZAJkzmQBmM5kAMzOZAAAzmQD/AJkAzACZAJkAmQBmAJkAMwCZAAAAmQD//2YAzP9mAJn/ZgBm/2YAM/9mAAD/ZgD/zGYAzMxmAJnMZgBmzGYAM8xmAADMZgD/mWYAzJlmAJmZZgBmmWYAM5lmAACZZgD/ZmYAzGZmAJlmZgBmZmYAM2ZmAABmZgD/M2YAzDNmAJkzZgBmM2YAMzNmAAAzZgD/AGYAzABmAJkAZgBmAGYAMwBmAAAAZgD//zMAzP8zAJn/MwBm/zMAM/8zAAD/MwD/zDMAzMwzAJnMMwBmzDMAM8wzAADMMwD/mTMAzJkzAJmZMwBmmTMAM5kzAACZMwD/ZjMAzGYzAJlmMwBmZjMAM2YzAABmMwD/MzMAzDMzAJkzMwBmMzMAMzMzAAAzMwD/ADMAzAAzAJkAMwBmADMAMwAzAAAAMwD//wAAzP8AAJn/AABm/wAAM/8AAAD/AAD/zAAAzMwAAJnMAABmzAAAM8wAAADMAAD/mQAAzJkAAJmZAABmmQAAM5kAAACZAAD/ZgAAzGYAAJlmAABmZgAAM2YAAABmAAD/MwAAzDMAAJkzAABmMwAAMzMAAAAzAAD/AAAAzAAAAJkAAABmAAAAMwAAAAAA7gAAAN0AAAC7AAAAqgAAAIgAAAB3AAAAVQAAAEQAAAAiAAAAEQAA7gAAAN0AAAC7AAAAqgAAAIgAAAB3AAAAVQAAAEQAAAAiAAAAEQAA7gAAAN0AAAC7AAAAqgAAAIgAAAB3AAAAVQAAAEQAAAAiAAAAEQAAAO7u7gDd3d0Au7u7AKqqqgCIiIgAd3d3AFVVVQBEREQAIiIiABEREQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkZGRkZGQAAAAAAAAAAAAAAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAAAAAAAAAAAAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAAAAAAAAAAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAAAAAAAAAAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAAAAAAAAAAAAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAAAAAAAAAAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAAAAAAAAAAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAAAAAAAAAAAAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAAAAAAAAAAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAAAAAAAAAAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAAABkZGRkZGQAAAAAZGRkZGRkAAAAAGRkZGRkZAAAAAAAAGRkZGRkZAAAAABkZGRkZGQAAAAAZGRk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MwCZmTMAZpkzADOZMwAAmTMA/2YzAMxmMwCZZjMAZmYzADNmMwAAZjMA/zMzAMwzMwCZMzMAZjMzADMzMwAAMzMA/wAzAMwAMwCZADMAZgAzADMAMwAAADMA//8AAMz/AACZ/wAAZv8AADP/AAAA/wAA/8wAAMzMAACZzAAAZswAADPMAAAAzAAA/5kAAMyZAACZmQAAZpkAADOZAAAAmQAA/2YAAMxmAACZZgAAZmYAADNmAAAAZgAA/zMAAMwzAACZMwAAZjMAADMzAAAAMwAA/wAAAMwAAACZAAAAZgAAADMAAAAAAO4AAADdAAAAuwAAAKoAAACIAAAAdwAAAFUAAABEAAAAIgAAABEAAO4AAADdAAAAuwAAAKoAAACIAAAAdwAAAFUAAABEAAAAIgAAABEAAO4AAADdAAAAuwAAAKoAAACIAAAAdwAAAFUAAABEAAAAIgAAABEAAADu7u4A3d3dALu7uwCqqqoAiIiIAHd3dwBVVVUAREREACIiIgAREREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGRkAAAAAAAAAGRkZAAAAGRkZAAAAAAAAABkZGQAAABkZGQAAAAAAAAAZGRkAAAAZGRkAAAAAAAAAGRkZAAAAGRkZAAAAAAAAABkZGQAAABkZGQAAGRkZAAAZGRkAAAAZGRkAABkZGQAAGRkZAAAAGRkZAAAZGRkAABkZGQAAABkZGQAAGRkZAAAZGRkAAAAZGRkAABkZGQAAGRkZAAAAGRkZAAAZGRkAABkZGQAAABkZGQAAGRkZAAAZGRkAAAAZGRkAABkZGQAAGRkZAAAAGRkZAAAZGRkAABkZGQAAABkZGQAAGRkZAAAZGRkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAACAAAABAAAAAAQAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n///////////////////////////////////////////////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf///////////////////////////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ////////////////////////////////////////////////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n///////////////////////////////////////////////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf///////////////////////////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ////////////////////////////////////////////////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n///////////////////////////////////////////////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf///////////////////////////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ////////////////////////////////////////////////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n///////////////////////////////////////////////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf////////////////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ/////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/MzOZ//////////////////////8zM5n/MzOZ/zMzmf8zM5n/MzOZ/zMzmf//////////////////////MzOZ/zMzmf8zM5n/MzOZ/zMzmf8zM5n///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAYAAAAMAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////////////////////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n//////////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ/zMzmf8zM5n///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAEAAAACAAAAABACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////////////////////////////////////////////////////8zM5n/MzOZ/zMzmf//////////////////////////////////////MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n//////////////////////////////////////zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ//////////////////////////////////////8zM5n/MzOZ/zMzmf////////////////8zM5n/MzOZ/zMzmf//////////////////////////////////////MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n//////////////////////////////////////zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ////////////MzOZ/zMzmf8zM5n///////////8zM5n/MzOZ/zMzmf////////////////8zM5n/MzOZ/zMzmf///////////zMzmf8zM5n/MzOZ////////////MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n///////////8zM5n/MzOZ/zMzmf///////////zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ////////////MzOZ/zMzmf8zM5n///////////8zM5n/MzOZ/zMzmf////////////////8zM5n/MzOZ/zMzmf///////////zMzmf8zM5n/MzOZ////////////MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n///////////8zM5n/MzOZ/zMzmf///////////zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ////////////MzOZ/zMzmf8zM5n///////////8zM5n/MzOZ/zMzmf////////////////8zM5n/MzOZ/zMzmf///////////zMzmf8zM5n/MzOZ////////////MzOZ/zMzmf8zM5n/////////////////MzOZ/zMzmf8zM5n///////////8zM5n/MzOZ/zMzmf///////////zMzmf8zM5n/MzOZ/////////////////zMzmf8zM5n/MzOZ////////////MzOZ/zMzmf8zM5n///////////8zM5n/MzOZ/zMzmf///////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
		// Remove current favicons and replace accordingly, or Favico has a cross domain issue since the real favicon is on redditstatic.com.
		$('head link[rel="shortcut icon"], head link[rel="icon"]').attr('href', faviconDataurl);

		// Init Favico
		favicon = new Favico();

		if (module.options.resetFaviconOnLeave.value) {
			// Prevent notification icon from showing up in bookmarks
			$(window).on('beforeunload', function() {
				favicon.reset();
			});
		}
	}

	function setupFloatingButtons() {
		if (!module.options.showFloatingEnvelope.value) return;
		if (floatingInboxCount) return;

		var pinHeader = modules['betteReddit'].options.pinHeader.value;
		if (pinHeader === 'sub' || pinHeader === 'none') {
			floatingInboxButton = RESUtils.createElement('a', 'NREMail');
			modules['floater'].addElement(floatingInboxButton);

			floatingInboxCount = RESUtils.createElement('a', 'NREMailCount');
			floatingInboxCount.display = 'none';
			floatingInboxCount.setAttribute('href', getInboxLink(true));
			modules['floater'].addElement(floatingInboxCount);
		}
	}

	function getInboxLink(havemail) {
		if (havemail && !module.options.unreadLinksToInbox.value) {
			return '/message/unread/';
		}

		return '/message/inbox/';
	}
	function getUnreadCount(container) {
		container = container || document.body;
		var mailCount = container.querySelector('.message-count');
		var value = mailCount && parseInt(mailCount.textContent, 0);

		return value;
	}
});
