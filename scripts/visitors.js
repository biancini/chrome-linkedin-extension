includeHTML('visitors');
chrome.storage.sync.set({ current_page: 'visitors' });

let txtLogs = document.getElementById('logs');
let btnGotoPage = document.getElementById('button-goto-page');
let btnGetList = document.getElementById('button-get-list');

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

async function gotoPage(element) {
    let href = "https://www.linkedin.com/me/profile-views/";

    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        await goToUrl(tabs[0], href);
    });

    btnGetList.disabled = false;
}

function getVisitorList(element) {
    chrome.storage.sync.set({ searching: true });
    btnGetList.disabled = true;
    chrome.runtime.connect({name: "visitorsList"});
    txtLogs.innerHTML = "";

    chrome.runtime.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(msg) {
            if (msg.terminated) {
                chrome.storage.sync.set({ searching: false });
                btnGetList.disabled = false;

                chrome.storage.sync.set({ searching: false });
                return;
            }
            
            txtLogs.insertAdjacentHTML('beforeend', "Utente <a href=\"" + msg.href + "\">" + msg.name + "</a>.<br/>");
            chrome.storage.sync.set({ vistor_list: txtLogs.innerHTML });
        });
    });    

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            { file: '/scripts/pushed/get_visitor_list.js' }
        )
    });
}

btnGotoPage.onclick = gotoPage;
btnGetList.onclick = getVisitorList;