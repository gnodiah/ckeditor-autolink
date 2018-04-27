(function() {
    'use strict';

    var REG_CHECK_EMPTY_STRING = /^(\u200B|\ufeff)*$/;
    var REG_REPLACE_EMPTY_CHAR = /\u200B|\ufeff/g;
    var REG_CHECK_LINK = /(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_CHECK_LINK_START = /^(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_PROTO_HTTP = /^(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|mailto:)/i;
    var REG_MAILTO = /^mailto:([^\?]+)/i;
    var REG_EMAIL = /^[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9!#$%&'*+\/=?.^_`{|}~-]+?@(?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9](?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9-_]*?[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9])?\.)+?(?:xn--[-a-z0-9]+|[a-zа-яё]{2,}|\d{1,3})$/i;
    var REG_CHECK_EMAIL = /(?:^|\s+)[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9!#$%&'*+\/=?.^_`{|}~-]+?@(?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9](?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9-_]*?[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9])?\.)+?(?:xn--[-a-z0-9]+|[a-zа-яё]{2,}|\d{1,3})(?:$|\s+)/i;
    var REG_CHECK_EMAIL_START = /^[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9!#$%&'*+\/=?.^_`{|}~-]+?@(?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9](?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9-_]*?[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9])?\.)+?(?:xn--[-a-z0-9]+|[a-zа-яё]{2,}|\d{1,3})/i;
    var TRAILING_PUNCTUATION = /([,.!:;?]+)$/;
    var CKEDITOR_SPACE = 32;
    var CKEDITOR_ENTER = 13;
    var CKEDITOR_SHIFT_ENTER = 2228237;
    var CKEDITOR_LINK_GENERATE_KEYS = [ CKEDITOR_SPACE, CKEDITOR_ENTER, CKEDITOR_SHIFT_ENTER ];

    CKEDITOR.plugins.add('autolink2', {
        'modes': { 'wysiwyg': 1 },

        'init': function(editor) {
            editor.addCommand('autolink2', {
                'modes': { 'wysiwyg': 1 },
                'editorFocus': false,
                'exec': autolink
            } );

            editor.on('key', function(event) {
                if (this.mode !== 'wysiwyg') {
                    return;
                }

                var ckeditorKeyCode = event.data.keyCode;

                if (CKEDITOR_LINK_GENERATE_KEYS.indexOf(ckeditorKeyCode) > -1) {
                    this.execCommand('autolink2');
                }
            });
        }
    });

    function autolink(editor) {
        var context = editor.editable().$;
        var selection = editor.getSelection();
        var rangeNative = selection.getNative().getRangeAt(0).cloneRange();
        var offset;
        var charCode;
        var start = rangeNative.startContainer;
        var diff;
        var savedCursorPosition = saveCursorPosition(selection);

        while (start.nodeType === Node.ELEMENT_NODE && rangeNative.startOffset > 0) {
            start = rangeNative.startContainer.childNodes[ rangeNative.startOffset - 1 ];
            if (!start) {
                break;
            }

            rangeNative.setStart(start, getOffsetNode(start));
            rangeNative.collapse(true);
            start = rangeNative.startContainer;
        }

        do {
            diff = -1;

            if (rangeNative.startOffset === 0) {
                start = rangeNative.startContainer.previousSibling;

                while (start && start.nodeType === Node.ELEMENT_NODE) {
                    if (isEmptyNode(start)) {
                        break;
                    }

                    if (!(CKEDITOR.env.gecko && (start = start.firstChild))) {
                        start = start.lastChild;
                    }
                }

                if (!start) {
                    break;
                }

                var defaultOffset = start.nodeType === Node.ELEMENT_NODE ? 0 : 1

                offset = getOffsetNode(start) || defaultOffset;
                var isLineBreak = start && start.nodeType === Node.TEXT_NODE &&
                    REG_CHECK_EMPTY_STRING.test(start.nodeValue);

                if (!offset || isLineBreak) {
                    break;
                }

            } else {
                start = rangeNative.startContainer;
                offset = rangeNative.startOffset;
            }

            offset = offset + diff;

            if (offset < 0) {
                break;
            }

            rangeNative.setStart(start, offset);
            charCode = rangeNative.toString().charCodeAt(0);

        } while (charCode !== 160 && charCode !== 32);

        var rangeString = rangeNative.toString().replace(REG_REPLACE_EMPTY_CHAR, '');
        var isLink = REG_CHECK_LINK.test(rangeString);
        var isEmail = REG_CHECK_EMAIL.test(rangeString);

        if (!isLink && !isEmail) {
            return;
        }

        var next;
        while ((rangeString = rangeNative.toString())) {
            if (isLink && REG_CHECK_LINK_START.test(rangeString)) {
                break;
            }

            if (isEmail && REG_CHECK_EMAIL_START.test(rangeString)) {
                break;
            }

            try {
                rangeNative.setStart(rangeNative.startContainer, rangeNative.startOffset + 1);

            } catch (error) {
                start = rangeNative.startContainer;

                while (!(next = start.nextSibling)) {
                    if (!context.contains(start)) {
                        return;
                    }

                    start = start.parentNode;
                }

                rangeNative.setStart(next, 0);
            }
        }

        var mailto = rangeNative.toString().match(REG_MAILTO);
        if (mailto) {
            if (!REG_EMAIL.test(mailto[ 1 ])) {
                return;
            }
        }

        var parent = rangeNative.startContainer;
        do {
            if (!context.contains(parent)) {
                break;
            }

            if (parent.tagName === 'A') {
                return;
            }

        } while ((parent = parent.parentNode));

        // Excluding of punctuation mark at the end of link.
        var linkEndsWithPunctuationMark = isLink && TRAILING_PUNCTUATION.exec(rangeString);
        if (linkEndsWithPunctuationMark) {
            var changedEndOffset = rangeNative.endOffset - linkEndsWithPunctuationMark[1].length;
            // changedEndOffset will less then 0 if rangeNative contains not only TextNodes(e.g. HTMLImageElement)
            if (changedEndOffset >= 0) {
                rangeNative.setEnd(rangeNative.endContainer, changedEndOffset);
            }
        }

        applyLink(rangeNative, editor, savedCursorPosition);
    }

    function applyLink(rangeNative, editor, savedCursorPosition) {
        editor.fire('saveSnapshot');

        var range = editor.createRange();

        var startNode = new CKEDITOR.dom.node(rangeNative.startContainer);
        var endNode = new CKEDITOR.dom.node(rangeNative.endContainer);

        range.setStart(startNode, rangeNative.startOffset);
        range.setEnd(endNode, rangeNative.endOffset);

        var href = rangeNative.toString().replace(REG_REPLACE_EMPTY_CHAR, '');
        href = CKEDITOR.tools.htmlDecodeAttr(href);

        if (!REG_PROTO_HTTP.test(href)) {
            if (REG_EMAIL.test(href)) {
                href = 'mailto:' + href;

            } else {
                href = 'http://' + href;
            }
        }

        var style = new CKEDITOR.style({
            'element': 'a',
            'attributes': { 'href': href }
        });

        style.type = CKEDITOR.STYLE_INLINE;
        style.applyToRange(range, editor);

        editor.fire('saveSnapshot');
        restoreCursorPosition(editor, savedCursorPosition, rangeNative);
    }

    function saveCursorPosition(selection) {
        var savedCursorPosition = new CKEDITOR.dom.text('');
        var tempRange = selection.getRanges()[0].clone();
        tempRange.collapse();
        tempRange.insertNode(savedCursorPosition);
        return savedCursorPosition;
    }

    function restoreCursorPosition(editor, savedCursorPosition, linkNativeRange) {
        var range = editor.createRange();
        range.setStart(savedCursorPosition);
        range.collapse();

        editor.getSelection().selectRanges([ range ]);

        var restoredNativeRange = editor.getSelection().getNative().getRangeAt(0);

        var restoredParent = restoredNativeRange.startContainer && restoredNativeRange.startContainer.parentNode;
        var linkTextParent = linkNativeRange.startContainer && linkNativeRange.startContainer.parentNode;

        // IE special cases
        // Cursor must be outside of link (a) element
        if (restoredParent && linkTextParent && restoredParent === linkTextParent) {
            var newRestoredRange = editor.createRange();
            newRestoredRange.setEndAfter(new CKEDITOR.dom.node(linkTextParent));
            newRestoredRange.collapse();
            editor.getSelection().selectRanges([ newRestoredRange ]);
        }
    }

    function isEmptyNode(node) {
        if (CKEDITOR.dtd.$inline[ node.tagName.toLowerCase() ] &&
            !node.textContent.replace(REG_REPLACE_EMPTY_CHAR, '').length) {

            return true;
        }

        return false;
    }

    function getOffsetNode(node) {
        return node.nodeType === Node.ELEMENT_NODE ?
            node.childNodes.length :
            node.nodeValue.length;
    }

}());
