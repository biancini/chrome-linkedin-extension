includeHTML('profile');

let btnLinkedIn = document.getElementById('button-linkedin');
let txtLogs = document.getElementById('logs');
let progressbar = document.getElementById('progress-bar');

let btnVerifyPage = document.getElementById('button-verify-page');
let txtSearch = document.getElementById('input-search');

let textSearchResult = document.getElementById('search-text-result');
let btnVisitProfiles = document.getElementById('button-visit-profiles');

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
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        let queryText = tabs[0].url.split('?')[1];
        txtSearch.value = queryText;

        chrome.tabs.sendMessage(tabs[0].id, {action: "getDOM"}, function(response) {
            var doc = new DOMParser().parseFromString(response.dom, "text/html");
            var results = doc.getElementsByClassName('search-results__total')[0];

            var num = parseInt(results.innerHTML.replace(/[^0-9]/g,''));
            if (num > 1000) { // 100 pages with 10 elements is the maximum number of resutls
                textSearchResult.classList.add("text-danger");
                textSearchResult.setAttribute('aria-valuenow', 1000);
            }
            else {
                textSearchResult.classList.remove("text-danger");
                textSearchResult.setAttribute('aria-valuenow', num);
            }
            textSearchResult.innerHTML = "Trovati " + num.toLocaleString() + " utenti.";
            btnVisitProfiles.disabled = false;
        });
    });
};

btnVisitProfiles.onclick = function(element) {
    btnVisitProfiles.disabled = true;
    var count = 0;
    var total = parseInt(textSearchResult.getAttribute('aria-valuenow'));
    chrome.runtime.connect({name: "visitedProfiles"});

    chrome.runtime.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(msg) {
            if (msg.terminated) {
                progressbar.setAttribute('aria-valuenow', 0);
                progressbar.style.width = "0%";

                btnVisitProfiles.disabled = false;
                return;
            }

            count++;
            var advancement = Math.round(100*count/total);
            progressbar.setAttribute('aria-valuenow', advancement);
            progressbar.style.width = advancement + "%";
            txtLogs.insertAdjacentHTML('beforeend', "Visitato <a href=\"" + msg.href + "\">" + msg.name + "</a>.<br/>");
        });
    });    

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            { file: '/scripts/visit_profiles.js' }
        )
    });
};