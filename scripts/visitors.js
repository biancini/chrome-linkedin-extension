includeHTML('visitors');
chrome.storage.sync.set({ current_page: 'visitors' });

let txtLogs = document.getElementById('logs');
let btnGotoPage = document.getElementById('button-goto-page');
let btnGetList = document.getElementById('button-get-list');

function restoreState() {
    chrome.storage.sync.get(['vistor_list'], function(result) {
        if (result.vistor_list)
            txtLogs.innerHTML = result.vistor_list;
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

async function gotoPage(element) {
    let href = "https://www.linkedin.com/me/profile-views/";

    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        await goToUrl(tabs[0], href);
    });

    txtLogs.innerHTML = "";
    btnGetList.disabled = false;
}

function getTextFromTime(valore) {
    let conversions = [
        { val: 43800, texts: ['mese', 'mesi'] },
        { val: 10080, texts: ['settimana', 'settimane'] },
        { val: 1440, texts: ['giorno', 'giorni'] },
        { val: 60, texts: ['ora', 'ore'] },
        { val: 1, texts: ['minuto', 'minuti'] }
    ];

    var ritorno = "";
    for (var i = 0; i < conversions.length; i++) {
        let conv = conversions[i];
        if (valore >= conv.val) {
            let v = parseInt(valore / conv.val);
            console.log(v + " - " + Math.min(v, 1));
            console.log(conv.texts[1]);

            ritorno = v + " " + ((v == 1) ? conv.texts[0] : conv.texts[1]);
            break;
        }
    }

    return ritorno;
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
            
            txtLogs.insertAdjacentHTML('beforeend', "Utente a distanza " + msg.distance + ": <a href=\"" + msg.href + "\">" + msg.name + "</a> <i>(" + getTextFromTime(msg.time) + " fa)</i>.<br/>");
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

restoreState();


linkedinLogin();

function linkedinLogin() {
    var apiKey = '86enstvsx676h0';
    var redirectUri = 'https://ealgejlegphadajhghjkdkggdonhmnao.chromiumapp.org/linkedin-oauth2/';
    var state = "sdfiugsdfhkionmdndsfjksd"; //random string
    var scope = "r_basicprofile%20r_emailaddress";

    var options = {
        'interactive': true,
        url: 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code'
            + '&client_id=' + apiKey
            + '&scope=' + scope
            + '&state=' + state
            + '&redirect_uri=' + redirectUri
    }

    chrome.identity.launchWebAuthFlow(options, function(redirect_url) {
        let urlParams = new URLSearchParams(new URL(redirect_url).search);
        let code = urlParams.get('code');

        var http = new XMLHttpRequest();
        var url = 'https://www.linkedin.com/oauth/v2/accessToken';
        var params = 'grant_type=authorization_code';
        params += '&code=' + code + '&redirect_uri=https%3A%2F%2Fealgejlegphadajhghjkdkggdonhmnao.chromiumapp.org%2Flinkedin-oauth2%2F&';
        params += 'client_id=86enstvsx676h0&client_secret=geOlFIVLLAX5o4qO';
        
        http.open('POST', url, true);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        http.onreadystatechange = function() {
            if (http.readyState == 4 && http.status == 200) {
                let resp = JSON.parse(http.responseText);
                getProfileData(resp.access_token);
            }
        }
        http.send(params);
    });
}

function getProfileData(access_token) {
    let userId = "filippo-visentin-82aa3745";
    let url = "https://api.linkedin.com/v2/people/(id:" + userId + ")";

    var request = new XMLHttpRequest(); 
    request.open("GET", url);
    request.setRequestHeader('Authorization', 'Bearer ' + access_token);
    request.onreadystatechange = function() { 
        if (request.readyState === 4 && request.status === 200) {
            console.log(request);
        }
    };
    request.send(null);
}