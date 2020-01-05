chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "getDOM") {
        sendResponse({dom: document.body.innerHTML});
    }
    else {
        sendResponse({}); // Send nothing..
    }
});