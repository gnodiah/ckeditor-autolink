## Autolink
Autolink is a plugin for CKEditor, used to generate a hyperlink automatically when you typing a URL-like string.
For example, when you input a string like *https://github.com*, it convert it to a real hyperlink rather than
plain text.

**NOTE:** To make this plugin works, you should type an extra character such as **SPACE KEY** or **ENTER KEY**.

## How to use
1. git clone this plugin repo:

   ```shell
   git clone https://github.com/Gnodiah/autolink.git autolink
   ```
2. copy this plugin directory to your ckeditor's plugins directory:

   ```shell
   cp -r autolink your_dir_path/ckeditor/plugins
   ```
3. add this plugin to your ckeditor's **config.js**, like this:

   ```javascript
   config.extraPlugins = 'autolink';
   ```

OK, now it works!
