let changeColor = document.getElementById('changeColor');

/*
chrome.storage.sync.get('color', function(data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
});
*/

visitProfiles.onclick = function(element) {
    let color = element.target.value;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
            { file: '/scripts/visit_profiles.js' }
        )
    });

    /*
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.executeScript(
            tabs[0].id,
                { file: '/vendor/jquery-3.4.1.min.js' },
                function() {
                    chrome.tabs.executeScript(
                        null,
                        { file: '/scripts/visit_profiles.js' }
                    );
                }
        );
    });
    */
};