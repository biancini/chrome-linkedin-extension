function sleep(milliseconds) {
    return new Promise(r => setTimeout(r, milliseconds));
}

async function run() {
    var process = true;
    var i = 0;

    while (process) {
        i = i + 1;
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(1000);
        
        var list = document.querySelector('.search-results__list');
        var nodes = list.getElementsByTagName('li');

        for (let node of nodes) {
            var parent = node.getElementsByClassName('search-result__info')[0];
            if (!parent) continue;
            var link = parent.getElementsByClassName('search-result__result-link')[0];
            
            if (!link) continue;
            var href = link.href;
            var span = link.getElementsByClassName('actor-name')[0];
            var name = span.innerHTML;
            
            console.log(i + ") Utente " + name + ": " + href);
            var oReq = new XMLHttpRequest();
            oReq.onload = function() {
                //console.log(this.responseText);
            };
            oReq.open("get", href, true);
            oReq.send();
        }

        var pagination = document.getElementsByTagName('artdeco-pagination')[0];
        var button = pagination.getElementsByClassName('artdeco-pagination__button--next')[0];
        if (!button || button.disabled) process = false;
        button.click();
        await sleep(1500);
    }

    console.log("Script ended.");
}

run();