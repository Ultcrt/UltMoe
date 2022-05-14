const path = require("path")

module.exports = {
  pages: {
    mainWindow: {
      entry: 'src/pages/mainWindow/mainWindow.js',
      template: 'public/mainWindow.html',
      filename: 'mainWindow.html',
      title: 'Main Window'
    },
    styledDialog: {
      entry: 'src/pages/styledDialog/styledDialog.js',
      template: 'public/styledDialog.html',
      filename: 'styledDialog.html',
      title: 'Styled Dialog'
    }
  },
  pluginOptions: {
    electronBuilder: {
      appId: 'UltMoe',
      mainProcessFile: 'src/js/background.js',
      preload: 'src/js/preload.js',
      builderOptions: {
        extraResources: [
          {
            "from": path.join(__dirname, 'build/icons/16x16.png'),
            "to": './'
          }
        ]
      }
    },
  }
}
