includeHTML('popup');

let btnLinkedIn = document.getElementById('button-linkedin');

let btnVerifyPage = document.getElementById('button-verify-page');
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

btnVerifyPage.onclick = async function(element) {
    let href = "https://www.linkedin.com/search/results/people/?keywords=";
    href += escape(txtSearch.value);
    
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        let queryText = tabs[0].url.split('?')[1];
        txtSearch.value = queryText;

        chrome.tabs.sendMessage(tabs[0].id, {action: "getDOM"}, function(response) {
            var doc = new DOMParser().parseFromString(response.dom, "text/html");
            var results = doc.getElementsByClassName('search-results__total')[0];

            var num = parseInt(results.innerHTML.replace(/[^0-9]/g,''));
            if (num > 1000) { // 100 pages with 10 elements is the maximum number of resutls
                textSearchResult.classList.add("text-danger");
            }
            else {
                textSearchResult.classList.remove("text-danger");
            }
            textSearchResult.innerHTML = "Trovati " + num.toLocaleString() + " utenti.";
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