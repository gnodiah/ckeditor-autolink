(function() {
    'use strict';

    var REG_CHECK_EMPTY_STRING = /^(\u200B|\ufeff)*$/;
    var REG_REPLACE_EMPTY_CHAR = /\u200B|\ufeff/g;
    var REG_CHECK_LINK = /(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_CHECK_LINK_START = /^(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_PROTO_HTTP = /^(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|mailto:)/i;
    var REG_MAILTO = /^mailto:([^\?]+)/i;
    var REG_EMAIL = /^[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9!#$%&'*+\/=?.^_`{|}~-]+?@(?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9](?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9-_]*?[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9])?\.)+?(?:xn--[-a-z0-9]+|[a-zа-яё]{2,}|\d{1,3})$/i;
    var REG_BREAK_STRING = /(?:^|\s)\S+$/;

    CKEDITOR.plugins.add('autolink2', {
        'modes': { 'wysiwyg': 1 },

        'init': function(editor) {
            editor.addCommand('autolink2', {
                'modes': { 'wysiwyg': 1 },
                'editorFocus': false,
                'exec': function(editor) {
                    autolink(editor);
                }
            } );

            editor.on('key', function(event) {
                if (this.mode !== 'wysiwyg') {
                    return;
                }

                if (event.data.keyCode === 32 || event.data.keyCode === 13) {
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
        var execReg;
        var diff;

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

                offset = getOffsetNode(start) || 1;

                if (start.nodeType === Node.TEXT_NODE) {
                    if (!REG_CHECK_EMPTY_STRING.test(start.nodeValue)) {
                        if ((execReg = REG_BREAK_STRING.exec(start.nodeValue))) {
                            offset = execReg.index;
                            diff = 0;

                        } else {
                            break;
                        }
                    }
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

        if (!REG_CHECK_LINK.test(rangeNative.toString().replace(REG_REPLACE_EMPTY_CHAR, ''))) {
            return;
        }

        var rangeString;
        var next;
        while ((rangeString = rangeNative.toString()) && !REG_CHECK_LINK_START.test(rangeString)) {
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

        applyLink(rangeNative, editor);
    }

    function applyLink(rangeNative, editor) {
        editor.fire('saveSnapshot');

        var range = editor.createRange();
        range.setStart(new CKEDITOR.dom.node(rangeNative.startContainer), rangeNative.startOffset);
        range.setEnd(new CKEDITOR.dom.node(rangeNative.endContainer), rangeNative.endOffset);

        var href = rangeNative.toString().replace(REG_REPLACE_EMPTY_CHAR, '');
        href = CKEDITOR.tools.htmlDecodeAttr(href);

        if (!REG_PROTO_HTTP.test(href)) {
            href = 'http://' + href;
        }

        var style = new CKEDITOR.style({
			'element': 'a',
			'attributes': { 'href': href }
		});

        style.type = CKEDITOR.STYLE_INLINE;
        style.applyToRange(range, editor);

        editor.fire('saveSnapshot');
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
