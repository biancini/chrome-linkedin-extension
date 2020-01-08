function sleep(milliseconds) {
    return new Promise(r => setTimeout(r, milliseconds));
}

async function visitUser(name, href, port) {
    var oReq = new XMLHttpRequest();
    oReq.onload = function() {
        port.postMessage({ terminated: false, name: name, href: href });
    };
    oReq.open("get", href, true);
    oReq.send();

    await sleep(200);
}

async function moveToNextPage() {
    var pagination = document.getElementsByTagName('artdeco-pagination')[0];
    var button = pagination.getElementsByClassName('artdeco-pagination__button--next')[0];

    if (!button || button.disabled) return false;
    button.click();
    
    await sleep(1000);
    return true;
}

async function run() {
    var process = true;
    var port = chrome.runtime.connect({ name: "visitedProfiles" });

    while (process) {
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(500);
        
        var list = document.querySelector('.search-results__list');
        var nodes = list.getElementsByTagName('li');

        for (let node of nodes) {
            var parent = node.getElementsByClassName('search-result__info')[0];
            if (!parent) continue;
            var link = parent.getElementsByClassName('search-result__result-link')[0];
            
            if (!link) continue;
            var span = link.getElementsByClassName('actor-name')[0];
            await visitUser(span.innerHTML, link.href, port);
        }

        process = await moveToNextPage();
    }

    port.postMessage({ terminated: true });
}

run();