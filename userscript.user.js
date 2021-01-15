// ==UserScript==
// @name         Overleaf Clarification
// @version      0.1
// @description  make sections and subsections more distinct (bolder) 
// @author       Myles Keller
// @match        https://*.overleaf.com/*
// @grant        unsafeWindow
// @icon         https://www.overleaf.com/favicon.ico
// ==/UserScript==

(function() {
    "use strict";

    let editorTarget = "#editor > div > div.ace-editor-body.ace_editor.ace_hidpi.ace-chrome > div.ace_scroller > div > div.ace_layer.ace_text-layer";
    let reviewTarget = "#review-panel > div.rp-entry-list.ng-scope > div.rp-entry-wrapper.ng-scope";

    waitForKeyElements (editorTarget, scriptCallbackFunction);

    const scriptId = "overleaf-clarifier";
    const commentSelector = ".rp-entry-comment";
    const lineSelector = ".ace_type";

    function log(...toLog) {
        console.log(`[${scriptId}]:`, ...toLog);
    }

    function setAndGetNodeId(node) {
        const nodeIdString = `${scriptId}-id`;

        let nodeId = node.getAttribute(nodeIdString);
        let hadNodeIdSet = true;

        if (!nodeId) {
            hadNodeIdSet = false;
            nodeId = Math.random().toString();
            node.setAttribute(nodeIdString, nodeId);
        }

        return { nodeId, hadNodeIdSet };
    }

    function addedNodeHandler(node) {

        if (!node.matches || !node.matches(lineSelector)) {
            return;
        }

        const { nodeId, hadNodeIdSet } = setAndGetNodeId(node);

        if (!hadNodeIdSet) {
            // this is a new element

            // if it's a editor line /////////////////////
            if (node.classList == "ace_storage ace_type"){

                if (node.innerText.toUpperCase().trim() === "\\SUBSECTION") {
                    node.parentElement.style.fontWeight = "bolder";
                    node.parentElement.style.fontStyle = "italic";
                    node.style.fontStyle = "normal";

                    log(`changed style of ` + node.parentElement.className);
                }

                if (node.innerText.toUpperCase().trim() === "\\SECTION") {
                    node.parentElement.style.fontWeight = "bolder";
                    log(`changed style of ` + node.parentElement.className);
                }
            }

            // if it's a review comment ////////////////////////////
            else if (node.classList == "rp-entry rp-entry-comment"){
                var nodeText = node.querySelector("div.rp-comment-loaded > div > p > span > span:nth-child(2)").innerText;
                if (nodeText.toUpperCase().startsWith("NOTE:")){
                    node.style.borderColor = "blue";

                    log(`changed style of ` + node.className);
                }
                if (nodeText.toUpperCase().startsWith("TODO:")){
                    node.style.borderColor = "red";
                    log(`changed style of ` + node.parentElement.className);
                }
            }
        }
    }

    function scriptCallbackFunction (element) {
        ////// for the editor ///////////////////////////////////////////////////
        const editorBodyObserver = new MutationObserver(function(mutations) {
            log(`checking editor with MutationObserver.`);

            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(addedNode => {
                    addedNodeHandler(addedNode);

                    // it might be text node or comment node which don't have querySelectorAll
                    addedNode.querySelectorAll &&
                        addedNode.querySelectorAll(lineSelector).forEach(addedNodeHandler);
                });
            });
        });


        editorTarget = document.querySelector("#editor > div > div.ace-editor-body.ace_editor.ace_hidpi.ace-chrome > div.ace_scroller > div > div.ace_layer.ace_text-layer");

        editorBodyObserver.observe(editorTarget, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        });
/*
        ////// for the review pane (not working yet) //////////////////////////////////////////////
        const reviewBodyObserver = new MutationObserver(function(mutations) {
            log(`checking review with MutationObserver.`);

            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(addedNode => {
                    addedNodeHandler(addedNode);

                    // it might be text node or comment node which don't have querySelectorAll
                    addedNode.querySelectorAll &&
                        addedNode.querySelectorAll(commentSelector).forEach(addedNodeHandler);
                });
            });
        });


        reviewTarget = document.querySelector("#review-panel > div.rp-entry-list.ng-scope > div.rp-entry-wrapper.ng-scope > div > comment-entry > div > div.rp-entry.rp-entry-comment");
        //reviewTarget = document.querySelector("div > comment-entry > div > div.rp-entry.rp-entry-comment");


        reviewBodyObserver.observe(reviewTarget, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        });
        */
    }

    //hacky way to wait for the page to actually load.
    function waitForKeyElements (
    selectorTxt, /* Required: The selector string that
                        specifies the desired element(s).
                    */
     actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
     bWaitOnce /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    ) {
        var editorTargetNodes, beditorTargetsFound;
        editorTargetNodes = document.querySelectorAll(selectorTxt);

        if (editorTargetNodes && editorTargetNodes.length > 0) {
            beditorTargetsFound = true;
            /*--- Found editorTarget node(s).  Go through each and act if they
            are new.
        */
            editorTargetNodes.forEach(function(element) {
                var alreadyFound = element.dataset.found == 'alreadyFound' ? 'alreadyFound' : false;

                if (!alreadyFound) {
                    //--- Call the payload function.
                    var cancelFound = actionFunction (element);
                    if (cancelFound){
                        beditorTargetsFound = false;
                    }
                    else{
                        element.dataset.found = 'alreadyFound';}
                }
            } );
        }
        else {
            beditorTargetsFound = false;
        }

        //--- Get the timer-control variable for this selector.
        var controlObj = waitForKeyElements.controlObj || {};
        var controlKey = selectorTxt.replace (/[^\w]/g, "_");
        var timeControl = controlObj [controlKey];

        //--- Now set or clear the timer as appropriate.
        if (beditorTargetsFound && bWaitOnce && timeControl) {
            //--- The only condition where we need to clear the timer.
            clearInterval (timeControl);
            delete controlObj [controlKey];
        }
        else {
            //--- Set a timer, if needed.
            if ( ! timeControl) {
                timeControl = setInterval ( function () {
                    waitForKeyElements (selectorTxt,
                                        actionFunction,
                                        bWaitOnce
                                       );
                },
                                           300
                                          );
                controlObj [controlKey] = timeControl;
            }
        }
        waitForKeyElements.controlObj = controlObj;
    }
})();
