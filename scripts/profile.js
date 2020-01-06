includeHTML('profile');
chrome.storage.sync.set({ current_page: 'profile' });

let btnSearch = document.getElementById('button-search');
let txtLogs = document.getElementById('logs');
let progressbar = document.getElementById('progress-bar');

let btnVerifyPage = document.getElementById('button-verify-page');
let txtSearch = document.getElementById('input-search');

let textSearchResult = document.getElementById('search-text-result');
let btnVisitProfiles = document.getElementById('button-visit-profiles');

function restoreState() {
    chrome.storage.sync.get(['search_text', 'profiles_found'], function(result) {
        if (result.search_text) {
            txtSearch.value = result.search_text;
            btnVisitProfiles.disabled = false;
            
            if (result.profiles_found > 1000) { // 100 pages with 10 elements is the maximum number of resutls
                textSearchResult.classList.add("text-danger");
                textSearchResult.setAttribute('aria-valuenow', 1000);
            }
            else {
                textSearchResult.classList.remove("text-danger");
                textSearchResult.setAttribute('aria-valuenow', num);
            }
            
            textSearchResult.innerHTML = "Trovati " + result.profiles_found.toLocaleString() + " utenti.";
            btnVisitProfiles.disabled = false;
        }
    });

    chrome.storage.sync.get(['searching', 'visit_advacement', 'visted_list'], function(result) {
        btnVisitProfiles.disabled = result.searching;

        if (result.searching) {
            progressbar.setAttribute('aria-valuenow', result.visit_advacement);
            progressbar.style.width = result.visit_advacement + "%";

            txtLogs.innerHTML = result.visted_list;
        }
    });
}

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

function setProfilesFound(num) {
    chrome.storage.sync.set({ profiles_found: num });

    if (num > 1000) { // 100 pages with 10 elements is the maximum number of resutls
        textSearchResult.classList.add("text-danger");
        textSearchResult.setAttribute('aria-valuenow', 1000);
    }
    else {
        textSearchResult.classList.remove("text-danger");
        textSearchResult.setAttribute('aria-valuenow', num);
    }

    if (num > 0) {
        textSearchResult.innerHTML = "Trovati " + num.toLocaleString() + " utenti.";
        btnVisitProfiles.disabled = false;
    }
    else {
        textSearchResult.innerHTML = "Verifica la pagina prima di poter procedere.";
        btnVisitProfiles.disabled = true;
        
        txtLogs.innerHTML = "";
        progressbar.setAttribute('aria-valuenow', 0);
        progressbar.style.width = "0%";
    }
}

btnSearch.onclick = async function(element) {
    let href = "https://www.linkedin.com/search/results/people/?";
    href += unescape(txtSearch.value);
    setProfilesFound(0);

    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        await goToUrl(tabs[0], href);
    });
};

btnVerifyPage.onclick = async function(element) {
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        let queryText = tabs[0].url.split('?')[1];
        if (!queryText) queryText = "";
        txtSearch.value = queryText;
        chrome.storage.sync.set({ search_text: queryText });

        chrome.tabs.sendMessage(tabs[0].id, {action: "getDOM"}, function(response) {
            var doc = new DOMParser().parseFromString(response.dom, "text/html");
            var results = doc.getElementsByClassName('search-results__total')[0];

            var num = 0;
            if (results) {
                num = parseInt(results.innerHTML.replace(/[^0-9]/g,''));
            }
            setProfilesFound(num);
        });
    });
};

btnVisitProfiles.onclick = function(element) {
    chrome.storage.sync.set({ searching: true });
    btnVisitProfiles.disabled = true;
    var count = 0;
    var total = parseInt(textSearchResult.getAttribute('aria-valuenow'));
    chrome.runtime.connect({name: "visitedProfiles"});
    txtLogs.innerHTML = "";

    chrome.runtime.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(msg) {
            if (msg.terminated) {
                chrome.storage.sync.set({ visit_advacement: 0 });
                progressbar.setAttribute('aria-valuenow', 0);
                progressbar.style.width = "0%";

                chrome.storage.sync.set({ searching: false });
                btnVisitProfiles.disabled = false;

                chrome.storage.sync.set({ searching: false, visit_advacement: 100 });
                return;
            }

            count++;
            var advancement = Math.round(100*count/total);
            chrome.storage.sync.set({ visit_advacement: advancement });

            progressbar.setAttribute('aria-valuenow', advancement);
            progressbar.style.width = advancement + "%";
            txtLogs.insertAdjacentHTML('beforeend', "Visitato <a href=\"" + msg.href + "\">" + msg.name + "</a>.<br/>");
            chrome.storage.sync.set({ visted_list: txtLogs.innerHTML });
        });
    });    

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            { file: '/scripts/visit_profiles.js' }
        )
    });
};

restoreState();