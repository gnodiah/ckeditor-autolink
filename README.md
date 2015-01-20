## Autolink
Autolink is a plugin for CKEditor, used to generate a hyperlink automatically when you typing a URL-like string.
For example, when you input a string like *https://github.com*, it convert it to a real hyperlink rather than
plain text.

**NOTE:** To make this plugin works, you should type an extra character such as **SPACE KEY** or **ENTER KEY**.

**Supported Chrome/Firefox/IE **

## How to use
1. git clone this plugin repo:

   ```shell
   git clone https://github.com/Gnodiah/ckeditor-autolink.git autolink
   ```
2. copy this plugin directory to your ckeditor's plugins directory:

   ```shell
   cd autolink
   cp -r plugins/autolink your_dir_path/ckeditor/plugins
   ```
3. add this plugin to your ckeditor's **config.js**, like this:

   ```javascript
   config.extraPlugins = 'autolink';
   ```

OK, now it works!

## LICENSE

The MIT License (MIT)

Copyright (c) 2014-2015 gnodiah(Hayden Wei)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
