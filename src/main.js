const puppeteer = require('puppeteer');
const cp = require('copy-paste');
const readline = require('readline');

const LANGUAGE_FROM = "zh"
const LANGUAGE_TO = "ja"
const URL = `https://www.deepl.com/ja/translator#${LANGUAGE_FROM}/${LANGUAGE_TO}/`

class Translator {
  constructor() {
    this.browser = null
    this.page = null
    this.results = []

    this._initialize()
  }

  async _initialize() {
    this.browser = await puppeteer.launch()
    this.page = await this.browser.newPage()
  }

  async translate() {
    const copiedText = await this._getTextFromClipBoard()

    await this.page.goto(`${URL}${copiedText}`);
    await this.page.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]')`);
    await this.page.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]').value`);
    await this.page.waitForFunction(`document.querySelector('[dl-test="translator-target-input"]').value.length > 0`);

    this.results = await this.page.$$('.lmt__translations_as_text__text_btn')

    const suffix = this.results.length > 1
      ? ` ...`
      : ''

    console.log(await this.results[0].evaluate(node => node.innerText) + suffix)
    console.log("")
  }

  async keepTranslating() {
    while (true)
      await this.translate()
  }

  _getTextFromClipBoard() {
    const line = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve, reject) => {
      line.question(': ', answer => {
        resolve(answer)
        line.close();
      })
    })
  }

  close() {
    this.browser.close();
  }
}

(async () => {
  const translater = new Translator()

  await translater.keepTranslating()

  await translater.close()
})();
