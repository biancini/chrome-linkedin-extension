function sleep(milliseconds) {
    return new Promise(r => setTimeout(r, milliseconds));
}

async function visitUser(name, href, distance, timeAgo, port) {
    var dist = parseInt(distance.replace(/[^0-9]/g,''));

    if (dist > 1) {
        var oReq = new XMLHttpRequest();
        oReq.onload = function() {
            // read profile
            port.postMessage({ terminated: false, name: name, distance: dist, href: href, time: timeAgo, visited: true });
        };
        oReq.open("get", href, true);
        oReq.send();
    }

    port.postMessage({ terminated: false, name: name, distance: dist, href: href, time: timeAgo, visited: false });
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

    while (process) {
        window.scrollTo(0, scroll);
        scroll += 1000;

        await sleep(500);
        
        var list = document.querySelector('.me-wvmp-viewers-list');
        var nodes = list.getElementsByClassName('me-wvmp-viewer-card');
        var names = [];

        for (let node of nodes) {
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
            var distance = link.getElementsByClassName('distance-badge')[0];
            if (!distance) continue;

            if (!names.includes(span.innerHTML)) {
                names.push(span.innerHTML);
                await visitUser(span.innerHTML, link.href, distance.innerHTML, timeAgo, port);
            }
        }   
    }

    port.postMessage({ terminated: true });
}

run();