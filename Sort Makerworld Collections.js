// ==UserScript==
// @name         Sort Makerworld Collections
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Sort the collections list alphabetically with "Default Collection" at the top.
// @author       You
// @match        https://makerworld.com/*/models/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Script started');

    // Function to extract collection name from an li element
    function getLiText(element) {
        if (!element) return '';
        const nameEl = element.querySelector('.mw-css-cavgld');
        if (nameEl && nameEl.textContent.trim()) {
            return nameEl.textContent.trim();
        }
        const directText = element.textContent.trim();
        if (directText) return directText.split('\n')[0].trim();
        const selectors = ['.MuiTypography-root', 'div', 'span', '*'];
        for (const selector of selectors) {
            const el = element.querySelector(selector);
            if (el && el.textContent.trim()) {
                return el.textContent.trim().split('\n')[0].trim();
            }
        }
        return '';
    }

    // Function to determine if an li element is sortable
    function isSortableLi(element) {
        if (!element || element.tagName !== 'LI' || element.querySelector('hr')) return false;
        const text = getLiText(element);
        if (text.toLowerCase() === 'new collection' || element.classList.contains('mw-css-1n1d5dw')) {
            return false;
        }
        return !!text;
    }

    // Debounce utility to limit function calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Function to sort the collections list
    function sortCollectionsList(ul, retries = 10, delay = 500, startTime = Date.now()) {
        console.log('sortCollectionsList called');
        const allLis = Array.from(ul.querySelectorAll('.MuiFormGroup-root li'));
        const sortableItems = allLis.filter(isSortableLi);
        const nonSortableItems = Array.from(ul.children).filter(item => {
            return item.tagName === 'HR' || item.querySelector('.mw-css-1n1d5dw');
        });
        console.log(`Found ${sortableItems.length} sortable items, ${nonSortableItems.length} non-sortable items, ${allLis.length} total li elements`);

        console.log('All ul children:');
        Array.from(ul.children).slice(0, 5).forEach((child, index) => {
            console.log(`Child ${index}: ${child.outerHTML.substring(0, 200)}...`);
        });
        if (ul.children.length > 5) {
            console.log(`...and ${ul.children.length - 5} more children`);
        }

        const formGroups = ul.querySelectorAll('.MuiFormGroup-root');
        if (formGroups.length) {
            console.log('MuiFormGroup-root contents (first li):', formGroups[0].outerHTML.substring(0, 500) + '...');
        } else {
            console.log('MuiFormGroup-root not found');
        }

        console.log('Before sorting:');
        sortableItems.forEach((item, index) => {
            const text = getLiText(item);
            console.log(`Sortable item ${index}: ${text || 'No text found'}`);
            if (index < 3) {
                console.log(`DOM for sortable item ${index}: ${item.outerHTML.substring(0, 200)}...`);
            }
        });
        if (sortableItems.length > 3) {
            console.log(`...and ${sortableItems.length - 3} more sortable items`);
        }

        console.log('Non-sortable items:');
        nonSortableItems.forEach((item, index) => {
            console.log(`Non-sortable item ${index}: ${item.outerHTML.substring(0, 200)}...`);
        });

        if ((sortableItems.length < 2 || allLis.length < 2) && retries > 0) {
            console.log(`Insufficient sortable items (${sortableItems.length}) or no li elements, retrying in ${delay}ms (${retries} retries left)`);
            setTimeout(() => sortCollectionsList(ul, retries - 1, delay, startTime), delay);
            return false;
        } else if (sortableItems.length < 2 || allLis.length < 2) {
            console.log(`Insufficient sortable items or no li elements after ${Date.now() - startTime}ms, exiting`);
            return true;
        }

        const anyNoText = sortableItems.some(item => !getLiText(item));
        if (anyNoText && retries > 0) {
            console.log(`Some sortable items have no text, retrying in ${delay}ms (${retries} retries left)`);
            setTimeout(() => sortCollectionsList(ul, retries - 1, delay, startTime), delay);
            return false;
        } else if (anyNoText) {
            console.log(`Failed to sort after ${Date.now() - startTime}ms due to missing text`);
            return true;
        }

        let defaultItem = null;
        sortableItems.forEach(item => {
            const text = getLiText(item);
            if (text && text.toLowerCase() === 'default collection') {
                defaultItem = item;
            }
        });
        console.log(defaultItem ? 'Default Collection found' : 'Default Collection not found');

        const otherItems = sortableItems.filter(item => item !== defaultItem);
        otherItems.sort((a, b) => {
            const aText = getLiText(a).toLowerCase();
            const bText = getLiText(b).toLowerCase();
            return aText.localeCompare(bText);
        });
        console.log('Sortable items sorted');

        while (ul.firstChild) ul.removeChild(ul.firstChild);
        if (defaultItem) {
            console.log('Appending Default Collection');
            const liWrapper = document.createElement('div');
            liWrapper.className = 'MuiFormGroup-root mw-css-1ytbthu';
            liWrapper.appendChild(defaultItem);
            ul.appendChild(liWrapper);
        }
        otherItems.forEach(item => {
            console.log(`Appending sorted item: ${getLiText(item) || 'No text'}`);
            const liWrapper = document.createElement('div');
            liWrapper.className = 'MuiFormGroup-root mw-css-1ytbthu';
            liWrapper.appendChild(item);
            ul.appendChild(liWrapper);
        });
        nonSortableItems.forEach(item => {
            console.log(`Appending non-sortable item: ${item.outerHTML.substring(0, 200)}...`);
            ul.appendChild(item);
        });

        console.log('After sorting:');
        try {
            const sortedItems = defaultItem ? [defaultItem, ...otherItems] : otherItems;
            sortedItems.forEach((item, index) => {
                const text = getLiText(item);
                console.log(`Sorted item ${index}: ${text || 'No text'}`);
            });
        } catch (e) {
            console.error('Error logging sorted items:', e);
        }

        console.log('Final ul children count:', ul.children.length);
        console.log(`Sorting completed in ${Date.now() - startTime}ms`);

        // Check for additional collections after sorting
        const newLis = Array.from(ul.querySelectorAll('.MuiFormGroup-root li')).filter(isSortableLi);
        if (newLis.length > sortableItems.length) {
            console.log(`Additional collections detected after sorting: ${newLis.length - sortableItems.length}`);
        }

        return true;
    }

    // Set up MutationObserver with debouncing
    function observeBody() {
        console.log('Starting body observer');
        let isSorted = false;
        const debouncedSort = debounce((ul) => {
            if (isSorted) {
                console.log('Menu already sorted, skipping');
                return;
            }
            if (sortCollectionsList(ul)) {
                console.log('Body observer disconnected');
                isSorted = true;
                observer.disconnect();
            }
        }, 100);

        const observer = new MutationObserver((mutations) => {
            if (isSorted) return; // Prevent further processing after sorting
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length || mutation.removedNodes.length) {
                    console.log('Body observer: mutations detected');
                    const menu = document.querySelector('.MuiMenu-root');
                    if (menu) {
                        console.log('Found MuiMenu-root');
                        const ul = menu.querySelector('ul');
                        if (ul && ul.children.length) {
                            console.log('Found ul inside MuiMenu-root with children');
                            debouncedSort(ul);
                        }
                    } else {
                        isSorted = false;
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('Body observer started');
    }

    observeBody();
})();
