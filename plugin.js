/**
 * @AutoLink plugin for CKEditor (2013.08.23)
 * @description 给非IE浏览器的链接自动添加<a>标签
 * @author Hayden Wei
 * @version 1.0
 */
CKEDITOR.plugins.add( 'autolink',{
	init:function(editor){
		editor.on( 'instanceReady', function(e) { 
      var cont = 0;
      // 跳过IE浏览器
      if (CKEDITOR.env.ie) {
        return;
      }
      var fillChar = CKEDITOR.env.ie && CKEDITOR.env.version == '6' ? '\ufeff' : '\u200B';
      // 判断node节点是否为<br>
      var isFillChar = function (node,isInStart) {
        return node.nodeType == 3 && !node.nodeValue.replace(new RegExp((isInStart ? '^' : '' ) + fillChar), '').length
      }
      // 判断node节点是否为<body>
      var isBody = function (node) {
        return  node && node.nodeType == 1 && node.tagName.toLowerCase() == 'body';
      }
      // 将str中的转义字符还原成html字符
      var html = function (str) {
        return str ? str.replace(/&((g|l|quo)t|amp|#39);/g, function (m) {
          return {
            '&lt;':'<',
            '&amp;':'&',
            '&quot;':'"',
            '&gt;':'>',
            '&#39;':"'"
          }[m]
        }) : '';
      }
      
      editor.document.on('reset', function() {
        cont = 0;
      });
			editor.autolink = function(e){
          var sel = editor.getSelection().getNative(),
              range = sel.getRangeAt(0).cloneRange(),
              offset,
              charCode;

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
                start = start.lastChild;
              }
              if (!start || isFillChar(start)){
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
        
        if (range.toString().replace(new RegExp(fillChar, 'g'), '').match(/(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.)/i)) {
          while(range.toString().length){
            if(/^(?:https?:\/\/|ssh:\/\/|ftp:\/\/|file:\/|www\.)/i.test(range.toString())){
              break;
            }
            try{ 
              range.setStart(range.startContainer,range.startOffset+1);
            }catch(e){
              var start = range.startContainer;
              while(!(next = start.nextSibling)){
                if(isBody(start)){
                  return;
                }
                start = start.parentNode;
              }
              range.setStart(next,0);
            }
          }

          //添加<a>标签
          var a = document.createElement('a'),text = document.createTextNode(' '),href;

          editor.undoManger && editor.undoManger.save();
          a.appendChild(range.extractContents());
          a.href = a.innerHTML = a.innerHTML.replace(/<[^>]+>/g,'');
          href = a.getAttribute("href").replace(new RegExp(fillChar,'g'),'');
          href = /^(?:https?:\/\/)/ig.test(href) ? href : "http://"+ href;
          a.setAttribute('_src',html(href));
          a.href = html(href);

          range.insertNode(a);
          a.parentNode.insertBefore(text, a.nextSibling);
          range.setStart(text, 0);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          editor.undoManger && editor.undoManger.save();
        }
			}
    editor.document.on("keydown", function(e) {
		  if (e.data.getKey() == 32) //空格
        editor.autolink(e);
    });
    editor.document.on("keyup", function(e) {
		  if (e.data.getKey() == 13) //回车
        editor.autolink(e);
    });
    });
	}
});
