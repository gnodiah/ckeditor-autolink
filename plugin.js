(function() {
    'use strict';

    var REG_CHECK_LINK = /(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_CHECK_LINK_START = /^(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_HTTP = /^https?:\/\//i;
    var REG_MAILTO = /^mailto:([^\?]+)/i;
    var REG_EMAIL = /^[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9!#$%&'*+\/=?.^_`{|}~-]+?@(?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9](?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9-_]*?[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9])?\.)+?(?:xn--[-a-z0-9]+|[a-zа-яё]{2,}|\d{1,3})$/i;

    CKEDITOR.plugins.add('autolink2', {
        modes: { 'wysiwyg': 1 },

        init: function(editor) {
            editor.on('instanceReady', function() {
                // skip IE
                // especially IE 11, because its User-Agent is Gecko, not MSIE
                if (CKEDITOR.env.ie || (CKEDITOR.env.gecko && CKEDITOR.env.version === 110000)) {
                    return;
                }

                var fillChar = CKEDITOR.env.ie && CKEDITOR.env.version == '6' ? '\ufeff' : '\u200B';

                var isFillChar = function (node, isInStart) {
                    return node.nodeType == 3 && !node.nodeValue.replace(new RegExp((isInStart ? '^' : '' ) + fillChar), '').length
                };

                var inContext = function(node) {
                    return editor.editable().$.contains(node);
                };

                var listToMap = function (list) {
                    if (!list) {
                        return {};
                    }

                    list = CKEDITOR.tools.isArray(list) ? list : list.split(',');
                    for (var i = 0, ci, obj = {}; ci = list[i++];) {
                        obj[ci.toUpperCase()] = obj[ci] = 1;
                    }

                    return obj;
                };

                var findParent = function (node, filterFn, includeSelf) {
                    if (node && inContext(node)) {
                        node = includeSelf ? node : node.parentNode;
                        while (node) {
                            if (!filterFn || filterFn(node) || !inContext(node)) {
                                return filterFn && !filterFn(node) && !inContext(node) ? null : node;
                            }
                            node = node.parentNode;
                        }
                    }
                    return null;
                };

                var findParentByTagName = function (node, tagNames, includeSelf, excludeFn) {
                    tagNames = listToMap(CKEDITOR.tools.isArray(tagNames) ? tagNames : [tagNames]);
                    return findParent(node, function (node) {
                        return tagNames[node.tagName] && !(excludeFn && excludeFn(node));
                    }, includeSelf);
                };

                var autolink = function(e){
                    var sel = editor.getSelection().getNative();
                    var range = sel.getRangeAt(0).cloneRange();
                    var offset;
                    var charCode;

                    var start = range.startContainer;
                    while (start.nodeType == 1 && range.startOffset > 0) {
                        start = range.startContainer.childNodes[range.startOffset - 1];
                        if (!start) {
                            break;
                        }

                        range.setStart(start, start.nodeType == 1 ? start.childNodes.length : start.nodeValue.length);
                        range.collapse(true);
                        start = range.startContainer;
                    }

                    do {
                        if (range.startOffset == 0) {
                            start = range.startContainer.previousSibling;

                            while (start && start.nodeType == 1) {
                                if (CKEDITOR.env.gecko && start.firstChild) {
                                    start = start.firstChild;
                                } else {
                                    start = start.lastChild;
                                }
                            }

                            if (!start || isFillChar(start)) {
                                break;
                            }

                            offset = start.nodeValue.length;

                        } else {
                            start = range.startContainer;
                            offset = range.startOffset;
                        }

                        range.setStart(start, offset - 1);
                        charCode = range.toString().charCodeAt(0);

                    } while (charCode != 160 && charCode != 32);

                    if (REG_CHECK_LINK.test(range.toString().replace(new RegExp(fillChar, 'g'), ''))) {
                        while (range.toString().length) {
                            if (REG_CHECK_LINK_START.test(range.toString())) {
                                break;
                            }

                            try {
                                range.setStart(range.startContainer, range.startOffset + 1);

                            } catch(e) {
                                var start = range.startContainer;

                                while (!(next = start.nextSibling)) {
                                    if (!inContext(start)) {
                                        return;
                                    }

                                    start = start.parentNode;
                                }

                                range.setStart(next, 0);
                            }
                        }

                        var mailto = range.toString().match(REG_MAILTO);
                        if (mailto) {
                            if (!REG_EMAIL.test(mailto[ 1 ])) {
                                return;
                            }
                        }

                        if (findParentByTagName(range.startContainer, 'a', true)) {
                            return;
                        }

                        editor.fire('saveSnapshot');

                        var a = document.createElement('a');
                        a.appendChild(range.extractContents());
                        a.href = a.innerHTML = a.innerHTML.replace(/<[^>]+>/g, '');

                        var href = a.getAttribute('href').replace(new RegExp(fillChar, 'g'), '');
                        if (!REG_HTTP.test(href) && !mailto) {
                            href = 'http://' + href;
                        }

                        a.setAttribute('data-cke-saved-href', CKEDITOR.tools.htmlDecodeAttr(href));
                        a.href = CKEDITOR.tools.htmlDecodeAttr(href);
                        range.insertNode(a);

                        var text = document.createTextNode(' ');
                        a.parentNode.insertBefore(text, a.nextSibling);
                        range.setStart(text.nextSibling, 0);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);

                        editor.fire('saveSnapshot');
                    }
                };

                editor.on('key', function(event) {
                    if (editor.mode !== 'wysiwyg') {
                        return;
                    }

                    if (event.data.keyCode === 32 || event.data.keyCode === 13) {
                        autolink(event);
                    }
                });
            });
        }
    });

}());
