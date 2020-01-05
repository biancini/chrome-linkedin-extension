let btnLinkedIn = document.getElementById('button-linkedin');

let btnSearch = document.getElementById('button-search');
let txtSearch = document.getElementById('input-search');

let textSearchResult = document.getElementById('search-text-result');
let btnVisitProfiles = document.getElementById('button-visit-profiles');

/*
chrome.storage.sync.get('color', function(data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
});
*/

function goToUrl(tab, href) {
    chrome.tabs.update(tab.id, {url: href});

    return new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function onUpdated(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(onUpdated);
                resolve();
            }
        });
    });
}

btnLinkedIn.onclick = async function(element) {
    let href = "https://www.linkedin.com/";
    
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        await goToUrl(tabs[0], href);
    });
};

btnSearch.onclick = async function(element) {
    let href = "https://www.linkedin.com/search/results/people/?keywords=";
    href += escape(txtSearch.value);
    
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        await goToUrl(tabs[0], href);

        chrome.tabs.sendMessage(tabs[0].id, {action: "getDOM"}, function(response) {
            var doc = new DOMParser().parseFromString(response.dom, "text/html");
            var results = doc.getElementsByClassName('search-results__total')[0];

            textSearchResult.innerHTML = "Trovati " + results.innerHTML.trim() + ".";
            btnVisitProfiles.disabled = false;
        });
    });
};

btnVisitProfiles.onclick = function(element) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            { file: '/scripts/visit_profiles.js' }
        )
    });
};