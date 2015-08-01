(function() {
    'use strict';

    var REG_CHECK_EMPTY_STRING = /^(\u200B|\ufeff)*$/;
    var REG_REPLACE_EMPTY_CHAR = /\u200B|\ufeff/g;
    var REG_CHECK_LINK = /(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_CHECK_LINK_START = /^(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.|mailto:)/i;
    var REG_HTTP = /^https?:\/\//i;
    var REG_MAILTO = /^mailto:([^\?]+)/i;
    var REG_EMAIL = /^[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9!#$%&'*+\/=?.^_`{|}~-]+?@(?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9](?:[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9-_]*?[a-zа-яёÇçĞğIıİiÖöŞşÜüẞß0-9])?\.)+?(?:xn--[-a-z0-9]+|[a-zа-яё]{2,}|\d{1,3})$/i;

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
        var selection = editor.getSelection().getNative();
        var range = selection.getRangeAt(0).cloneRange();
        var offset;
        var charCode;
        var start = range.startContainer;

        while (start.nodeType === Node.ELEMENT_NODE && range.startOffset > 0) {
            start = range.startContainer.childNodes[ range.startOffset - 1 ];
            if (!start) {
                break;
            }

            range.setStart(start, start.nodeType === Node.ELEMENT_NODE ? start.childNodes.length : start.nodeValue.length);
            range.collapse(true);
            start = range.startContainer;
        }

        do {
            if (range.startOffset === 0) {
                start = range.startContainer.previousSibling;

                while (start && start.nodeType === Node.ELEMENT_NODE) {
                    if (!(CKEDITOR.env.gecko && (start = start.firstChild))) {
                        start = start.lastChild;
                    }
                }

                if (!start || (start.nodeType === Node.TEXT_NODE && !REG_CHECK_EMPTY_STRING.test(start.nodeValue))) {
                    break;
                }

                offset = start.nodeValue.length;

            } else {
                start = range.startContainer;
                offset = range.startOffset;
            }

            if (offset === 0) {
                break;
            }

            range.setStart(start, offset - 1);
            charCode = range.toString().charCodeAt(0);

        } while (charCode !== 160 && charCode !== 32);

        if (!REG_CHECK_LINK.test(range.toString().replace(REG_REPLACE_EMPTY_CHAR, ''))) {
            return;
        }

        var rangeString;
        var next;
        while ((rangeString = range.toString()) && !REG_CHECK_LINK_START.test(rangeString)) {
            try {
                range.setStart(range.startContainer, range.startOffset + 1);

            } catch (error) {
                start = range.startContainer;

                while (!(next = start.nextSibling)) {
                    if (!context.contains(start)) {
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

        var parent = range.startContainer;
        do {
            if (!context.contains(parent)) {
                break;
            }

            if (parent.tagName === 'A') {
                return;
            }

        } while ((parent = parent.parentNode));

        editor.fire('saveSnapshot');

        var a = context.ownerDocument.createElement('a');
        a.appendChild(range.extractContents());
        a.href = a.innerHTML = a.innerHTML.replace(/<[^>]+>/g, '');

        var href = a.getAttribute('href').replace(REG_REPLACE_EMPTY_CHAR, '');
        if (!REG_HTTP.test(href) && !mailto) {
            href = 'http://' + href;
        }
        href = CKEDITOR.tools.htmlDecodeAttr(href);

        a.setAttribute('data-cke-saved-href', href);
        a.href = href;
        range.insertNode(a);

        var text = context.ownerDocument.createTextNode(' ');
        a.parentNode.insertBefore(text, a.nextSibling);
        range.setStart(text.nextSibling, 0);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);

        editor.fire('saveSnapshot');
    }

}());
