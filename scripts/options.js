includeHTML('options');
chrome.storage.sync.set({ current_page: 'options' });

let btnClearCache = document.getElementById('btn-clear-cache');

btnClearCache.onclick = function(element) {
    if (confirm("Sei sicuro di voler cancellare tutti i dati in cache?")) {
        let storage_keys = ['search_text', 'profiles_found', 'searching', 'visit_advacement', 'visted_list'];
        chrome.storage.sync.remove(storage_keys);
    }
};