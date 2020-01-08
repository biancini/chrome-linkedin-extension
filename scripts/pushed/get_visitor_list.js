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

function getTimeFromText(valore) {
    valore = valore.trim();
    let conversions = [
        { vals: [ 'secondo', 'secondi', 'second', 'seconds' ], ratio: 0 },
        { vals: [ 'minuto', 'minuti', 'minute', 'minutes' ], ratio: 1 },
        { vals: [ 'ora', 'ore', 'hour', 'hours' ], ratio: 60 },
        { vals: [ 'giorno', 'giorni', 'day', 'days' ], ratio: 1440 },
        { vals: [ 'settimana', 'settimane', 'week', 'weeks' ], ratio: 10080 },
        { vals: [ 'mese', 'mesi', 'month', 'months' ], ratio: 43800 }
    ];

    var ritorno = parseInt(valore.replace(/[^0-9]/g,''));
    conversions.forEach(function(conv) {
        conv.vals.forEach(function(val) {
            if (valore.includes(val)) {
                ritorno *= conv.ratio;
            }
        });
    });
    return ritorno;
}

async function run() {
    var process = true;
    var port = chrome.runtime.connect({ name: "visitorsList" });
    var scroll = 1000;

    var count = 0;
    var curCount = 0;

    while (process) {
        window.scrollTo(0, scroll);
        scroll += 1000;

        await sleep(500);
        
        var list = document.querySelector('.me-wvmp-viewers-list');
        var nodes = list.getElementsByClassName('me-wvmp-viewer-card');

        for (let node of nodes) {
            count++;
            while (count < curCount) continue;

            var timeAgo = node.getElementsByClassName('me-wvmp-viewer-card__time-ago')[0];
            if (!timeAgo) continue;
            timeAgo = getTimeFromText(timeAgo.innerHTML);

            if (timeAgo > 10080) {
                process = false;
                break;
            }

            var parent = node.getElementsByClassName('me-wvmp-viewer-card__viewer-info')[0];
            if (!parent) continue;
            var link = parent.getElementsByClassName('card-link-inherit')[0];
            if (!link) continue;
            var span = link.getElementsByClassName('me-wvmp-viewer-card__name-text')[0];
            if (!span) continue;
            await visitUser(span.innerHTML, link.href, port);
        }
    }

    port.postMessage({ terminated: true });
}

run();